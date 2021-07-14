#!/usr/bin/env node

'use strict';

const glob = require('glob');
const path = require('path');
const fs = require('fs');

module.exports = (collection, environment = '', globals = '') => {
  const { CollectionRunner } = require('../../src/newman/runner');
  const { NewmanConfig } = require('../../src/newman/config');

  if (!collection) {
    console.error(`Please specify collection file.`);
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
  const apiId = collectionPathDirs[2];
  const targetSite = collectionPathDirs[4];
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
        }/${targetSite}/collections/${apiId}/${testType}/${fileName}`
      )
  ) {
    console.error(`Collection file is not placed collectly.`);
    process.exit(1);
  }

  // environment file path
  const environmentPath = environment ? path.resolve(environment) : '';
  if (environmentPath && !fs.existsSync(environmentPath)) {
    console.error(`Environment file does not exist.`);
    process.exit(1);
  }

  // globals file path
  const globalsPath = globals ? path.resolve(globals) : '';
  if (globalsPath && !fs.existsSync(globalsPath)) {
    console.error(`Globals file does not exist.`);
    process.exit(1);
  }

  runner
    .run(
      collectionPath,
      environmentPath,
      globalsPath,
      targetSite,
      apiId,
      testType
    )
    .catch((err) => {
      process.exit(1);
    });
};
