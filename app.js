const {createMessageAdapter} = require('@slack/interactive-messages');
const http = require('http');
const express = require('express');
const request = require('request');
const uuidv4 = require('uuid/v4');

let messagePool = {};

function setMessage(messageId, text) {
    messagePool[messageId] = text;
    return messageId;
}

function getMessage(messageId) {
    return messagePool[messageId];
}

function removeMessage(messageId) {
    delete messagePool[messageId];
}

function responseTranslationServices(responseUrl, messageId) {
    let options = {
        method: 'POST',
        url: responseUrl,
        body: {
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
                            "value": messageId,
                            "text": "Microsoft",
                            "type": "button"
                        },
                        {
                            "name": "ts_google",
                            "value": messageId,
                            "text": "Google",
                            "type": "button"
                        }
                    ]
                }
            ]
        },
        json: true,
    };

    request(options, function (err, res, body) {
    });
}

function responseLanguages(responseUrl, messageId) {
    let options = {
        method: 'POST',
        url: responseUrl,
        body: {
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
                            "name": "en",
                            "value": messageId,
                            "text": "English",
                            "type": "button"
                        },
                        {
                            "name": "vi",
                            "value": messageId,
                            "text": "Vietnamese",
                            "type": "button"
                        }
                    ]
                }
            ]
        },
        json: true,
    };

    request(options, function (err, res, body) {
    });
}

function responseTranslation(responseUrl, messageId, to) {
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
            'text': getMessage(messageId)
        }],
        json: true,
    };

    request(options, function (err, res, body) {
        let options = {
            method: 'POST',
            url: responseUrl,
            body: {
                "response_type": "ephemeral",
                "text": body[0].translations[0].text,
            },
            json: true,
        };

        request(options, function (err, res, body) {
            removeMessage(messageId)
        });
    });
}

const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET || 'd08639fae19d281fc14fd32b878f109a');
const app = express();

app.use('/slack/actions', slackInteractions.expressMiddleware());

slackInteractions.action('translate', (payload, respond) => {
    responseTranslationServices(
        payload.response_url,
        setMessage(payload.message.client_msg_id, payload.message.text)
    );
    return '_Waiting..._';
});

slackInteractions.action('select_translate_service', (payload, respond) => {
    responseLanguages(
        payload.response_url,
        payload.actions[0].value
    );
    return '_Waiting..._';
});

slackInteractions.action('select_language', (payload, respond) => {
    responseTranslation(
        payload.response_url,
        payload.actions[0].value,
        payload.actions[0].name
    );
    return '_Waiting..._';
});

const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});