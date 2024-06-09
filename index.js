const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/health', (_, res) => res.status(200).end())

app.get('/status', (request, response) => response.json({clients: clients.length}));


let subscribers = [];

function eventsHandler(request, response, next) {
  const {subscriberId} = request.params

  console.log('Connection open: ', subscriberId)

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };

  response.writeHead(200, headers);

  const newSubscriber = {
    subscriberId,
    response
  };

  subscribers.push(newSubscriber);

  request.on('close', () => {
    console.log('Connection close: ', subscriberId)

    subscribers = subscribers.filter(el => el.subscriberId !== subscriberId)
  });
}

app.get('/subscribe/:subscriberId', eventsHandler);

const publishEvent = async (request, response, next) => {
  const {subscriberId} = request.params
  
  response.status(200).end()

  const subscriber = subscribers.find(el => el.subscriberId === subscriberId)

  if (subscriber) {
    subscriber.response.write(`${JSON.stringify(request.body)}\n\n`);
  }
}

app.post('/publish/:subscriberId', publishEvent);

const PORT = 80;

app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})
