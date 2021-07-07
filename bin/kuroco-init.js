#!/usr/bin/env node

'use strict';

const fs = require('fs');
const readline = require('readline');

const configFile = 'kuroco-newman.config.json';

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text = '', defaultValue = null) =>
  new Promise((resolve, reject) => {
    readlineInterface.question(text, (answer) => {
      if (answer) {
        resolve(answer);
      } else {
        if (defaultValue != null) {
          resolve(defaultValue);
        } else {
          reject();
        }
      }
    });
  });

module.exports = () => {
  (async () => {
    const baseDir = await question(`tests base directory: (tests) `, 'tests');
    const reportDir = await question(
      `report output directory: (reports) `,
      'reports'
    );

    const config = {
      baseDir: baseDir,
      report: {
        outputDir: reportDir,
        templates: {},
      },
      target: [],
    };

    // output config
    await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2));
    console.log(`Output config file to ${configFile}`);

    // make directories
    await fs.promises.mkdir(baseDir, { recursive: true });
    await fs.promises.mkdir(reportDir, { recursive: true });

    process.exit(0);
  })();
};
