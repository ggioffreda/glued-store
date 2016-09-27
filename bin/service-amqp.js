#!/usr/bin/env node

const StoreProcessor = require('../src/processor').StoreProcessor,
  ServiceManager = require('glued-common').ServiceManager,
  manager = new ServiceManager();

manager.load(new StoreProcessor());
