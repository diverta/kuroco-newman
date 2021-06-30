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
    `specify collection file`
  )
  .action((args) => {
    console.log('run collection');
    console.log(args);
  });
// program.command('openapi', 'openapi');

program
  .command('openapi-fetch')
  .description('')
  .action((args) => {
    console.log('openapi fetch');
    console.log(args);
  });

program
  .command('openapi-to-collection')
  .description('')
  .action((args) => {
    console.log('openapi to-collection');
    console.log(args);
  });

program
  .command('report-generate-index')
  .description('generate index')
  .action((args) => {
    console.log('report generate-index');
    console.log(args);
  });

program.parse();
