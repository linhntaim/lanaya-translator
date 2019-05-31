const config = require('./config');

const {createMessageAdapter} = require('@slack/interactive-messages');
const http = require('http');
const express = require('express');
const request = require('request');
const uuidv4 = require('uuid/v4');

let services = {
    microsoft: 'Microsoft',
    google: 'Google',
};
let languages = {
    en: 'English',
    vi: 'Vietnamese',
    ja: 'Japanese',
};
let messagePool = {};
let messageLifeTime = 86400000 / 2; // 86400000 = 1 day

function setMessage(messageId, text) {
    messagePool[messageId] = {
        at: Date.now(),
        text: text,
    };
    return messageId;
}

function setMessageService(messageId, service) {
    messagePool[messageId].service = service;
    return messageId;
}

function getMessage(messageId) {
    return messagePool[messageId].text;
}

function removeMessage(messageId) {
    delete messagePool[messageId];
}

function autoRemoveMessage() {
    let now = Date.now(), deleted = [];
    for (let messageId in messagePool) {
        if (now - messagePool[messageId].at > messageLifeTime) {
            deleted.push(messageId);
        }
    }
    deleted.forEach(messageId => {
        removeMessage(messageId);
    });
}

function responseText(responseUrl, text) {
    let options = {
        method: 'POST',
        url: responseUrl,
        body: {
            "text": text,
            "response_type": "ephemeral",
        },
        json: true,
    };

    request(options, (err, res, body) => {
    });
}

function responseTranslationServices(responseUrl, messageId) {
    let actions = () => {
        let a = [];
        for (let service in services) {
            a.push({
                "name": service,
                "value": messageId,
                "text": services[service],
                "type": "button"
            });
        }
        return a;
    };

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
                    "actions": actions()
                }
            ]
        },
        json: true,
    };

    request(options, (err, res, body) => {
    });
}

function responseLanguages(responseUrl, messageId, service) {
    if (service === 'google') {
        responseText(responseUrl, services[service] + " is currently not supported");
        return;
    }

    setMessageService(messageId, service);

    let actions = () => {
        let a = [];
        for (let lang in languages) {
            a.push({
                "name": lang,
                "value": messageId,
                "text": languages[lang],
                "type": "button"
            });
        }
        return a;
    };

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
                    "actions": actions()
                }
            ]
        },
        json: true,
    };

    request(options, (err, res, body) => {
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

    request(options, (err, res, body) => {
        responseText(responseUrl, body[0].translations[0].text);
        autoRemoveMessage();
    });
}

const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET || config.DEFAULT_SLACK_SIGNING_SECRET);
const app = express();

app.use('/', slackInteractions.expressMiddleware());

slackInteractions.action('translate', (payload, respond) => {
    console.log('action/translate');
    console.log(payload);
    responseTranslationServices(
        payload.response_url,
        setMessage(payload.message.client_msg_id, payload.message.text)
    );
    return '_Waiting..._';
});

slackInteractions.action('select_translate_service', (payload, respond) => {
    console.log('action/select_translate_service');
    console.log(payload);
    responseLanguages(
        payload.response_url,
        payload.actions[0].value,
        payload.actions[0].name
    );
    return '_Waiting..._';
});

slackInteractions.action('select_language', (payload, respond) => {
    console.log('action/select_language');
    console.log(payload);
    responseTranslation(
        payload.response_url,
        payload.actions[0].value,
        payload.actions[0].name
    );
    return '_Waiting..._';
});

const port = process.env.PORT || config.DEFAULT_PORT;
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});