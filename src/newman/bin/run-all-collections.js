#!/usr/bin/env node

'use strict';

const { CollectionRunner } = require('../runner');
const { NewmanConfig } = require('../config');

const newmanConfig = NewmanConfig.load();
const runner = new CollectionRunner(newmanConfig);

// Run all collections
runner.runAll().then((results) => {
  if (results.some((result) => result.status === 'rejected')) {
    process.exit(1);
  }
});
