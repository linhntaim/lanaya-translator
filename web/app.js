require('dotenv').config()
const http = require('http')
const express = require('express')
const request = require('request')
const app = express()

function requestTeamInfo(accessToken) {
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
            res.send("Error encountered: \n" + JSON.stringify(JSONresponse)).status(200).end()
        } else {
            res.redirect('https://' + JSONresponse.team.domain + '.slack.com')
        }
    })
}

function requestAuth(code) {
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
            res.send("Error encountered: \n" + JSON.stringify(JSONresponse)).status(200).end()
        } else {
            requestTeamInfo(JSONresponse.access_token)
        }
    })
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/add_to_slack.html')
})

app.get('/redirect', (req, res) => {
    requestAuth(req.query.code)
})

const port = process.env.PORT
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`)
})