#!/usr/bin/env node

const StorePubSub = require('../src/store-pubsub').StorePubSub
const ServiceManager = require('glued-common').ServiceManager
const manager = new ServiceManager()

manager.load(new StorePubSub())
