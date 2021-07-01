#!/usr/bin/env node

'use strict';

const { program } = require('commander');

// program
//   .command('run')
//   .description(`run all collections`)
//   .action((args) => {
//     console.log('run');
//     console.log(args);
//   });

program
  .command('run')
  .description(`run collections`)
  .option(
    '-e, --environment, --env <environment-file>',
    `specify environment file`
  )
  .option('-c, --collection <collection>', `specify collection file`)
  .action((args) => {
    if (
      args.hasOwnProperty('collection') ||
      args.hasOwnProperty('environment')
    ) {
      // run specified collection
      if (
        !args.hasOwnProperty('collection') ||
        !args.hasOwnProperty('environment')
      ) {
        console.error(
          `If specify collection or environment, both are required.`
        );
        process.exit(1);
      }
      process.argv = [
        process.argv[0],
        process.argv[1],
        args.collection,
        args.environment,
      ];
      require('./run-collection.js');
    } else {
      // run all collections
      require('./run-all-collections.js');
    }
  });
// program.command('openapi', 'openapi');

program
  .command('openapi-fetch')
  .description('fetch openapi')
  .requiredOption('-i, --id <id>', `API id`)
  .requiredOption('-k, --key <sdk_key>', `SDK key`)
  .option('-o, --output <output>', `openapi.json output path`)
  .action((args) => {
    process.argv = [
      process.argv[0],
      process.argv[1],
      '--id',
      args.id,
      '--key',
      args.key,
    ];
    if (args.hasOwnProperty('output')) {
      process.argv.push('--output', args.output);
    }
    require('./fetch-openapi.js');
  });

program
  .command('openapi-to-collection')
  .description(`update collection from openapi.json`)
  .option('-o, --output <output>', `collection output path`)
  .action((args) => {
    process.argv = [process.argv[0], process.argv[1]];
    if (args.hasOwnProperty('output')) {
      process.argv.push('-o', args.output);
    } else {
      process.argv.push('-w');
    }
    require('./openapi-to-collection.js');
  });

program
  .command('report-generate-index')
  .description('generate index')
  .action((args) => {
    require('./generate-reports-index.js');
  });

program.parse();
