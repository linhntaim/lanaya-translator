// Import dependencies
const { createMessageAdapter } = require('@slack/interactive-messages');
const http = require('http');
const express = require('express');

// Create the adapter using the app's signing secret, read from environment variable
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET || 'd08639fae19d281fc14fd32b878f109a');

// Initialize an Express application
// NOTE: You must use a body parser for the urlencoded format before attaching the adapter
const app = express();

// Attach the adapter to the Express application as a middleware
// NOTE: The path must match the Request URL and/or Options URL configured in Slack
app.use('/slack/actions', slackInteractions.expressMiddleware());

// Run handlerFunction for any interactions from messages with a callback_id of welcome_button
slackInteractions.action('translate', handlerFunction);

// This function is discussed in "Responding to actions" below
function handlerFunction() {
    console.log('handlerFunction');
}

// Select a port for the server to listen on.
// NOTE: When using ngrok or localtunnel locally, choose the same port it was started with.
const port = process.env.PORT || 3000;

// Start the express application server
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});