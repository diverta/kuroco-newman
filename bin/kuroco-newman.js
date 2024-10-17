#!/usr/bin/env node

'use strict';

const { program } = require('commander');

// kuroco-newman run
program
  .command('run')
  .description(`run collections`)
  .option(
    '-e, --environment, --env <environment-file>',
    `specify environment file`,
    ''
  )
  .option('-g, --globals <globals-file>', `specify globals file`, '')
  .option('-c, --collection <collection>', `specify collection file`)
  .option('-k, --insecure', `disables SSL validation`)
  .action((options) => {
    // configure common options
    const runOptions = {
      ...(options.hasOwnProperty('insecure') ? { insecure: options.insecure } : {})
    };

    if (options.hasOwnProperty('collection')) {
      // run specified collection
      const runCollection = require('./commands/run.js');
      runCollection(options.collection, options.environment, options.globals, runOptions);
    } else {
      // run all collections
      const runAll = require('./commands/run-all.js');
      runAll(runOptions);
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
    const fetchOpenapi = require('./commands/openapi-fetch.js');
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
    const openapiToCollection = require('./commands/openapi-to-collection.js');
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
    const generateIndex = require('./commands/report-generate-index.js');
    generateIndex();
  });

program
  .command('init')
  .description(`create kuroco-newman.config.json`)
  .action((options) => {
    const kurocoInit = require('./commands/init.js');
    kurocoInit();
  });

program.parse();
