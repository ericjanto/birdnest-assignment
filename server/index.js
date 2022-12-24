const express = require('express')
const request = require('request');
var parseString = require('xml2js').parseString;
const xml2js = require('xml2js')
const schedule = require('node-schedule');

var parser = new xml2js.Parser();

// ===================================================================
// DATA FETCHING & CACHING
// -----------------------
// Functionality for fetching and caching data from the external
// Reaktor API.
// ===================================================================

const API_ENDPOINT = 'https://assignments.reaktor.com/birdnest/'
const API_DRONES = API_ENDPOINT + 'drones'
const API_PILOTS = API_ENDPOINT + 'pilots'

var mostRecentSnapshot = 'not updated'

function updateSnapshot() {
    request(API_DRONES, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            parser.parseStringPromise(body).then(function (parsedResult) {
                mostRecentSnapshot = parsedResult
            })
                .catch(function (err) {
                    throw Error(`Internal server error: ${err}`)
                });
        }
    });
}

// Schedules to retrieve and update snapshot every 2min. Cron notation.
schedule.scheduleJob('*/1 * * * * *', function () {
    updateSnapshot()
});

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
        res.status(200).send(mostRecentSnapshot)
    }
    else {
        res.setHeader('Allow', ['GET'])
        res.status(405).end(`Method ${method} not allowed`)
    }
})

app.listen(app.listen(process.env.PORT || devPort))

// ===================================================================
// Helper Functions
// ===================================================================