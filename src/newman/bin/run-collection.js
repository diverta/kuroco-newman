#!/usr/bin/env node

'use strict';

const glob = require('glob');
const appRoot = require('app-root-path');

const { CollectionRunner } = require('../runner');
const { NewmanConfig } = require('../config');

const [, , targetSite, apiId, testType, ...options] = process.argv;

if (!targetSite || !apiId || !testType) {
  console.error(`Please specify target.
node index.js <target site> <api_id> ( unit | integration )`);
  process.exit(1);
}

const newmanConfig = NewmanConfig.load();
const runner = new CollectionRunner(newmanConfig);

// collection file path
const collectionFiles = glob.sync(
  appRoot.resolve(
    `${newmanConfig.baseDir}/${targetSite}/apis/${apiId}/collections/${testType}/*.postman_collection.json`
  )
);

// environment file path
const environmentFiles = glob.sync(
  appRoot.resolve(
    `${newmanConfig.baseDir}/${targetSite}/environments/*.postman_environment.json`
  )
);
if (environmentFiles.length != 1) {
  console.error('Cannot determine postman environment file.');
  process.exit(1);
}
const environmentFile = environmentFiles[0];

Promise.allSettled(
  collectionFiles.map((collectionFile) =>
    runner.run(collectionFile, environmentFile, targetSite, apiId, testType)
  )
).then((results) => {
  if (results.some((result) => result.status === 'rejected')) {
    process.exit(1);
  }
});
