const { calculateDistanceToNest, normaliseToMeter, violatesNDZ } = require('./distance.js')
const express = require('express')
const request = require('request')
const xml2js = require('xml2js')
const schedule = require('node-schedule')

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

// Keeps track of serialnumber : min_pos, timestamp of violation
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
        .then(data => { droneDict[serialNumber]['pilot_info'] = data })
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
        if (violatesNDZ([droneX, droneY])) {
            const sn = drone.serialNumber[0]

            updateTimesDict(timestamp, sn)

            const dist = calculateDistanceToNest([droneX, droneY])
            if (sn in droneDict) {
                droneDict[sn].last_violated = timestamp

                if (dist < droneDict[sn].min_dist_to_nest) {
                    droneDict[sn].min_dist_to_nest = dist
                    droneDict[sn].min_position_x = droneX
                    droneDict[sn].min_position_y = droneY
                }
            } else {
                droneDict[sn] = {
                    "last_violated": timestamp,
                    "min_position_x": droneX,
                    "min_position_y": droneY,
                    "min_dist_to_nest": dist,
                }
                addPilotInfo(sn)
            }
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
                if (droneDict[serialNumber].last_violated == stalest) {
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

app.get('/', async (req, res) => {
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

app.get('/violating-pilots', async (req, res) => {
    const {
        method
    } = req

    if (method == 'GET') {
        res.status(200).send(droneDict)
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