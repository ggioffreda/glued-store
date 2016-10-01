#!/usr/bin/env node

const StoreController = require('../src/controller').StoreController
const ServiceManager = require('glued-common').ServiceManager
const manager = new ServiceManager()

manager.load(new StoreController())
