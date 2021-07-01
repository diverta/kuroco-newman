#!/usr/bin/env node

'use strict';

const { program } = require('commander');

// kuroco-newman run
program
  .command('run')
  .description(`run collections`)
  .option(
    '-e, --environment, --env <environment-file>',
    `specify environment file`
  )
  .option('-c, --collection <collection>', `specify collection file`)
  .action((options) => {
    if (
      options.hasOwnProperty('collection') ||
      options.hasOwnProperty('environment')
    ) {
      // run specified collection
      if (
        !options.hasOwnProperty('collection') ||
        !options.hasOwnProperty('environment')
      ) {
        console.error(
          `If specify collection or environment, both are required.`
        );
        process.exit(1);
      }
      const runCollection = require('./run-collection.js');
      runCollection(options.collection, options.environment);
    } else {
      // run all collections
      const runAll = require('./run-all-collections.js');
      runAll();
    }
  });

// kuroco-newman openapi-fetch
program
  .command('openapi-fetch')
  .description('fetch openapi')
  .argument('<target>', `target site`)
  .requiredOption('-i, --id <id>', `API id`)
  .requiredOption('-k, --key <sdk_key>', `SDK key`)
  .option('-o, --output <output>', `openapi.json output path`)
  .action((target, options) => {
    const fetchOpenapi = require('./fetch-openapi.js');
    if (options.hasOwnProperty('output')) {
      fetchOpenapi(target, options.id, options.key, options.output);
    } else {
      fetchOpenapi(target, options.id, options.key);
    }
  });

// kuroco-newman openapi-to-collection
program
  .command('openapi-to-collection')
  .description(`update collection from openapi.json`)
  .argument('<openapi>', `openapi.json`)
  .argument('<collection>', `collection.json`)
  .option('-o, --output <output>', `collection output path`)
  .action((openapi, collection, options) => {
    const openapiToCollection = require('./openapi-to-collection.js');
    if (options.hasOwnProperty('output')) {
      openapiToCollection(openapi, collection, options.output);
    } else {
      openapiToCollection(openapi, collection);
    }
  });

// kuroco-nreman report-generate-index
program
  .command('report-generate-index')
  .description('generate index')
  .action((options) => {
    const generateIndex = require('./generate-reports-index.js');
    generateIndex();
  });

program.parse();
