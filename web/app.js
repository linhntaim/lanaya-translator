require('dotenv').config()
const http = require('http')
const express = require('express')
const request = require('request')
const app = express()

app.get('/auth', (req, res) => {
    res.sendFile(__dirname + '/add_to_slack.html')
})

app.get('/auth/redirect', (req, res) => {
    const options = {
        uri: 'https://slack.com/api/oauth.access?code='
            + req.query.code +
            '&client_id=' + process.env.CLIENT_ID +
            '&client_secret=' + process.env.CLIENT_SECRET +
            '&redirect_uri=' + process.env.REDIRECT_URI,
        method: 'GET'
    }
    request(options, (error, response, body) => {
        const JSONresponse = JSON.parse(body)
        if (!JSONresponse.ok) {
            console.log(JSONresponse)
            res.send("Error encountered: \n" + JSON.stringify(JSONresponse)).status(200).end()
        } else {
            console.log(JSONresponse)
            res.send("Success!")
        }
    })
})

const port = process.env.PORT
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`)
})