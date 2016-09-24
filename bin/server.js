#!/usr/bin/env node

const http = require('http'),
  bodyParser = require('body-parser'),
  express = require('express'),
  mb = require('glued-message-bus'),
  messageBus = new mb.MessageBus(
    process.env.GLUED_STORE_AMQP || 'amqp://localhost',
    process.env.GLUED_STORE_BUS || 'glued_message_bus'
  ),
  dl = require('glued-data-layer'),
  dlConf = process.env.GLUED_STORE_RETHINKDB ? require(process.env.GLUED_STORE_RETHINKDB) : {},
  dataLayer = new dl.DataLayer(dlConf);

messageBus.connectModule(function (err, messageBusChannel) {
  if (err) {
    console.error('Cannot connect to the AMQP server. Try installing and running RabbitMQ.');
    throw err;
  }

  dataLayer.connectModule(function (err, dataLayer) {
    if (err) {
      console.error('Cannot connect to RethinkDB. Check that it is installed and running.');
      throw err;
    }

    const app = express(),
      m = require('../src/model'),
      model = new m.StoreModel(dataLayer),
      c = require('../src/controller'),
      p = require('../src/processor'),
      controller = new c.StoreController(express, model, messageBusChannel),
      processor = new p.StoreProcessor(model, messageBusChannel);

    processor.subscribeHandlers();

    app.use(bodyParser.json());
    app.use('/', controller.getRouter());

    http.createServer(app).listen(process.env.GLUED_STORE_PORT || 9210, process.env.GLUED_STORE_HOST || '127.0.0.1');
  });
});
