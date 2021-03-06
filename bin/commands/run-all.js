#!/usr/bin/env node

'use strict';

const { CollectionRunner } = require('../../src/newman/runner');
const { NewmanConfig } = require('../../src/newman/config');

module.exports = () => {
  const newmanConfig = NewmanConfig.load();
  const runner = new CollectionRunner(newmanConfig);

  // Run all collections
  runner.runAll().then((results) => {
    if (results.some((result) => result.status === 'rejected')) {
      process.exit(1);
    }
  });
};
