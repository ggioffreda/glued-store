#!/usr/bin/env node

const StoreRpc = require('../src/rpc').StoreRpc
const ServiceManager = require('glued-common').ServiceManager
const manager = new ServiceManager()

manager.load(new StoreRpc())
