const {createMessageAdapter} = require('@slack/interactive-messages');
const http = require('http');
const express = require('express');
const request = require('request');
const uuidv4 = require('uuid/v4');

function responseTranslationServices(responseUrl) {
    let options = {
        method: 'POST',
        url: responseUrl,
        body: [{
            "text": "",
            "response_type": "ephemeral",
            "attachments": [
                {
                    "text": "Choose a Translation Service",
                    "fallback": "Unable to choose a Translation Service",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "callback_id": "select_translate_service",
                    "actions": [
                        {
                            "name": "ts_microsoft",
                            "value": "ts_microsoft",
                            "text": "Microsoft",
                            "type": "button"
                        },
                        {
                            "name": "ts_google",
                            "value": "ts_google",
                            "text": "Google",
                            "type": "button"
                        }
                    ]
                }
            ]
        }],
        json: true,
    };

    console.log('responseTranslationServices');
    request(options, function (err, res, body) {
        console.log(JSON.stringify(body, null, 4));
    });
}

function responseLanguages(responseUrl) {
    let options = {
        method: 'POST',
        url: responseUrl,
        body: [{
            "text": "",
            "response_type": "ephemeral",
            "attachments": [
                {
                    "text": "Translate to:",
                    "fallback": "Unable to choose a Language",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "callback_id": "select_language",
                    "actions": [
                        {
                            "name": "english",
                            "value": "english",
                            "text": "English",
                            "type": "button"
                        },
                        {
                            "name": "vietnamese",
                            "value": "vietnamese",
                            "text": "Vietnamese",
                            "type": "button"
                        }
                    ]
                }
            ]
        }],
        json: true,
    };

    console.log('responseLanguages');
    request(options, function (err, res, body) {
        console.log(JSON.stringify(body, null, 4));
    });
}

function responseTranslation(responseUrl, text, to) {
    let options = {
        method: 'POST',
        baseUrl: 'https://api.cognitive.microsofttranslator.com/',
        url: 'translate',
        qs: {
            'api-version': '3.0',
            'to': to,
        },
        headers: {
            'Ocp-Apim-Subscription-Key': '9a0b3d626b484773a81f8da460efda2e',
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
        },
        body: [{
            'text': text
        }],
        json: true,
    };

    console.log('api.cognitive.microsofttranslator.com');
    request(options, function (err, res, body) {
        console.log(JSON.stringify(body, null, 4));

        let options = {
            method: 'POST',
            url: responseUrl,
            body: [{
                "response_type": "ephemeral",
                "text": body[0].translations[0].text,
            }],
            json: true,
        };

        console.log('responseTranslation');
        request(options, function (err, res, body) {
            console.log(JSON.stringify(body, null, 4));
        });
    });
}

const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET || 'd08639fae19d281fc14fd32b878f109a');
const app = express();

app.use('/slack/actions', slackInteractions.expressMiddleware());

slackInteractions.action('translate', (payload, respond) => {
    console.log(payload);
    responseTranslationServices(payload.response_url);
    return {};
});

slackInteractions.action('select_translate_service', (payload, respond) => {
    console.log(payload);
    responseLanguages(payload.response_url);
    return {};
});

slackInteractions.action('select_language', (payload, respond) => {
    console.log(payload);
    responseTranslation(payload.response_url, 'Hello Vietnam', 'vi');
    return {};
});

const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});