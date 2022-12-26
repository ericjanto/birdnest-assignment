const { calculateDistanceToNest, normaliseToMeter, violatesNDZ } = require('./distance.js')
const cors = require('cors')
const express = require('express')
const request = require('request')
const schedule = require('node-schedule')
const xml2js = require('xml2js')

var parser = new xml2js.Parser()

// ===================================================================
// DATA FETCHING & CACHING
// -----------------------
// Functionality for fetching and caching data from the external
// Reaktor API.
// ===================================================================

// Schedules to retrieve and update snapshot every second (cron notation)
schedule.scheduleJob('*/1 * * * * *', function () {
    fetchSnapshot()
})

const API_ENDPOINT = 'https://assignments.reaktor.com/birdnest/'
const API_DRONES = API_ENDPOINT + 'drones'
const API_PILOTS = API_ENDPOINT + 'pilots'
const STALE_LIMIT_SEC = 10 * 60 // 10min in s

// Keyed on serialnumber
var droneDict = {}

// Keeps track of timestamp of violation : serialnumber
// (makes stale data removal more efficient)
var droneTimesDict = {}

function fetchSnapshot() {
    request(API_DRONES, (requestErr, response, body) => {
        if (!requestErr && response.statusCode === 200) {
            parser.parseStringPromise(body).then(function (parsedResult) {
                cacheData(parsedResult)
            })
                .catch(function (parseErr) {
                    console.log(`XML parsing error: ${parseErr}`)
                })
        } else if (requestErr) {
            console.log(`Internal server error: ${requestErr}`)
        }
    })
}

function addPilotInfo(serialNumber) {
    fetch(`${API_PILOTS}/${serialNumber}`)
        .then(response => response.json())
        .then(data => {
            const pilotInfo = {}
            // Only extract needed data
            pilotInfo['first_name'] = data.firstName
            pilotInfo['last_name'] = data.lastName
            pilotInfo['phone_number'] = data.phoneNumber
            pilotInfo['email'] = data.email
            droneDict[serialNumber]['pilot_info'] = pilotInfo
        })
        .catch(error => {
            console.log(`Internal server error when fetching from pilot API: ${error}`)
        })
}

function cacheData(snapshotJSON) {
    const drones = snapshotJSON.report.capture[0].drone
    const timestamp = snapshotJSON.report.capture[0]["$"].snapshotTimestamp

    drones.forEach(drone => {
        const droneX = normaliseToMeter(drone.positionX[0])
        const droneY = normaliseToMeter(drone.positionY[0])

        const sn = drone.serialNumber[0]
        const dist = calculateDistanceToNest([droneX, droneY])

        if (sn in droneDict) {
            updateTimesDict(timestamp, sn)
            droneDict[sn].last_seen = timestamp

            if (dist < droneDict[sn].min_dist_to_nest) {
                droneDict[sn].min_dist_to_nest = dist
                droneDict[sn].min_position_x = droneX
                droneDict[sn].min_position_y = droneY
            }

            if (violatesNDZ(dist)) {
                droneDict[sn].last_violated = timestamp
            }
        } else if (violatesNDZ(dist)) {
            droneDict[sn] = {
                "last_seen": timestamp,
                "last_violated": timestamp,
                "min_position_x": droneX,
                "min_position_y": droneY,
                "min_dist_to_nest": dist,
            }
            addPilotInfo(sn)
        }
    })

    removeStaleData()
}

function updateTimesDict(timestamp, serialNumber) {
    if (timestamp in droneTimesDict &&
        droneTimesDict[timestamp].indexOf(serialNumber) == -1) {
        droneTimesDict[timestamp].push(serialNumber)
    } else {
        droneTimesDict[timestamp] = [serialNumber]
    }
}

function removeStaleData() {
    // Only last timestamp can ever be > 10min since we add / remove
    // every 1s
    const timestamps = Object.keys(droneTimesDict)
    const stalest = timestamps[0]

    // Date objects in JS are always UTC, same as Birdnest API
    const now = new Date()
    const timediffSeconds = (now - new Date(stalest)) / 1000

    if (timediffSeconds > STALE_LIMIT_SEC) {
        const potentialStaleDrones = droneTimesDict[stalest]

        if (potentialStaleDrones) {
            potentialStaleDrones.forEach(serialNumber => {
                if (droneDict[serialNumber].last_seen == stalest) {
                    delete droneDict[serialNumber]
                }
            })
        }

        delete droneTimesDict[stalest]
    }
}

// ===================================================================
// Server API
// ===================================================================
const app = express()
const devPort = 4000

const allowlist = ['http://localhost:3000/', 'https://birdnest-assignment.vercel.app/']
const corsOptionsDelegate = function (req, callback) {
    let corsOptions
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}

// var corsOptions = {
//     origin: 'https://birdnest-assignment.vercel.app/',
//     optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }

app.get('/',cors(corsOptionsDelegate), async (req, res) => {
    const {
        method
    } = req

    if (method == 'GET') {
        res.status(200).send('Server alive. Endpoints: /violating-pilots')
    }
    else {
        res.setHeader('Allow', ['GET'])
        res.status(405).end(`Method ${method} not allowed`)
    }
})

app.get('/violating-pilots', cors(corsOptionsDelegate), async (req, res) => {
    const {
        method
    } = req

    if (method == 'GET') {
        res.status(200).send(flattenDictData(droneDict))
    }
    else {
        res.setHeader('Allow', ['GET'])
        res.status(405).end(`Method ${method} not allowed`)
    }
})

app.listen((process.env.PORT || devPort), () => {
    if (process.env.PORT == undefined) {
        console.log(`Server listening on port ${devPort}`)
    }
})

// ===================================================================
// HELPERS
// -------
// If accumulated to more than 2 functions, move to a utils file.
// ===================================================================

function flattenDictData(dict) {
    const data = []

    Object.keys(dict).forEach(serialnumber => {
        let flattened = { 'serialnumber': serialnumber }

        const valuesDict = dict[serialnumber]
        Object.keys(valuesDict).forEach(key => {
            if (key == 'pilot_info') {
                const pilotDict = valuesDict[key]
                Object.keys(pilotDict).forEach(pilotKey => {
                    flattened[pilotKey] = pilotDict[pilotKey]
                })
            } else {
                flattened[key] = valuesDict[key]
            }
        })
        data.push(flattened)
    })

    return data
}