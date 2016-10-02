#!/usr/bin/env node

const StoreHttp = require('../src/store-http').StoreHttp
const ServiceManager = require('glued-common').ServiceManager
const manager = new ServiceManager()

manager.load(new StoreHttp())
