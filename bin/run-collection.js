#!/usr/bin/env node

'use strict';

const glob = require('glob');
const path = require('path');
const fs = require('fs');

module.exports = (collection, environment) => {
  const { CollectionRunner } = require('../src/newman/runner');
  const { NewmanConfig } = require('../src/newman/config');

  if (!collection || !environment) {
    console.error(`Please specify collection & environment files.`);
    process.exit(1);
  }

  const newmanConfig = NewmanConfig.load();
  const runner = new CollectionRunner(newmanConfig);
  runner.reportGenerator.initReportDir();

  // collection file path
  const collectionPath = path.resolve(collection);
  if (!fs.existsSync(collectionPath)) {
    console.error(`Collection file does not exist.`);
    process.exit(1);
  }
  // site name & api id & type fetch
  const collectionPathDirs = collectionPath.split(path.sep).reverse();
  const fileName = collectionPathDirs[0];
  const testType = collectionPathDirs[1];
  const apiId = collectionPathDirs[3];
  const targetSite = collectionPathDirs[5];
  // validate
  if (
    !fileName ||
    !testType ||
    !apiId ||
    !targetSite ||
    collectionPath !=
      path.resolve(
        `${process.cwd()}/${
          newmanConfig.baseDir
        }/${targetSite}/apis/${apiId}/collections/${testType}/${fileName}`
      )
  ) {
    console.error(`Collection file is not placed collectly.`);
    process.exit(1);
  }

  // environment file path
  const environmentPath = path.resolve(environment);
  if (!fs.existsSync(environmentPath)) {
    console.error(`Environment file does not exist.`);
    process.exit(1);
  }

  runner
    .run(collectionPath, environmentPath, targetSite, apiId, testType)
    .catch((err) => {
      process.exit(1);
    });
};
