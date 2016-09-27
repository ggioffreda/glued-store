#!/usr/bin/env node

const StoreController = require('../src/controller').StoreController,
  ServiceManager = require('glued-common').ServiceManager,
  manager = new ServiceManager();

manager.load(new StoreController());
