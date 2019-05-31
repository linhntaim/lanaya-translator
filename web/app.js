require('dotenv').config()
const http = require('http')
const express = require('express')
const request = require('request')
const app = express()

function requestAuth(code, callback) {
    const options = {
        uri: 'https://slack.com/api/oauth.access?code='
            + code +
            '&client_id=' + process.env.CLIENT_ID +
            '&client_secret=' + process.env.CLIENT_SECRET +
            '&redirect_uri=' + process.env.REDIRECT_URI,
        method: 'GET'
    }
    request(options, (error, response, body) => {
        const JSONresponse = JSON.parse(body)
        console.log(JSONresponse)
        if (!JSONresponse.ok) {
            console.log("Error encountered")
        } else {
            requestTeamInfo(JSONresponse.access_token, callback)
        }
    })
}

function requestTeamInfo(accessToken, callback) {
    const options = {
        uri: 'https://slack.com/api/team.info',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    }
    request(options, (error, response, body) => {
        const JSONresponse = JSON.parse(body)
        console.log(JSONresponse)
        if (!JSONresponse.ok) {
            console.log("Error encountered")
        } else {
            callback(JSONresponse.team.domain)
        }
    })
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/add_to_slack.html')
})

app.get('/redirect', (req, res) => {
    requestAuth(req.query.code, (domain) => {
        res.redirect('https://' + domain + '.slack.com')
    })
})

const port = process.env.PORT
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`)
})