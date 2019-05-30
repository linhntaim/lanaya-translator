// Import dependencies
const { createMessageAdapter } = require('@slack/interactive-messages');
const http = require('http');
const express = require('express');
// Imports the Google Cloud client library
const {Translate} = require('@google-cloud/translate');

// Create the adapter using the app's signing secret, read from environment variable
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET || 'd08639fae19d281fc14fd32b878f109a');

// Initialize an Express application
// NOTE: You must use a body parser for the urlencoded format before attaching the adapter
const app = express();

// Attach the adapter to the Express application as a middleware
// NOTE: The path must match the Request URL and/or Options URL configured in Slack
app.use('/slack/actions', slackInteractions.expressMiddleware());

async function translateText(text, target) {
    // [START translate_translate_text]
    // Imports the Google Cloud client library
    const {Translate} = require('@google-cloud/translate');

    // Creates a client
    const translate = new Translate();

    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    console.log('Translations:');
    translations.forEach((translation, i) => {
        console.log(`${text[i]} => (${target}) ${translation}`);
    });
    return translations;
}

// Run handlerFunction for any interactions from messages with a callback_id of welcome_button
slackInteractions.action('translate', (payload, respond) => {
    // `payload` is an object that describes the interaction
    console.log(payload);

    translateText(payload.message.text, 'vi').then((translations)=> {
        console.log('Promise:');
        console.log(translations);
    });

    // Before the work completes, return a message object that is the same as the original but with
    // the interactive elements removed.
    const reply = payload.original_message;
    delete reply.attachments[0].actions;
    return reply;
});

// Select a port for the server to listen on.
// NOTE: When using ngrok or localtunnel locally, choose the same port it was started with.
const port = process.env.PORT || 3000;

// Start the express application server
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});