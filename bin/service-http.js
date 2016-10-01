#!/usr/bin/env node

const StoreHttp = require('../src/http').StoreHttp
const ServiceManager = require('glued-common').ServiceManager
const manager = new ServiceManager()

manager.load(new StoreHttp())
