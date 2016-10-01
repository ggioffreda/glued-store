#!/usr/bin/env node

const StoreProcessor = require('../src/processor').StoreProcessor
const ServiceManager = require('glued-common').ServiceManager
const manager = new ServiceManager()

manager.load(new StoreProcessor())
