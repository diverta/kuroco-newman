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
    if (fs.existsSync(configFile)) {
      const response = await question(
        `${configFile} already exists.
Do you want to regenerate?: (yes) `,
        'yes'
      );
      if (!/y(es)?/i.test(response)) {
        console.log();
        process.exit(0);
      }
    }

    const baseDir = await question(`tests base directory: (tests) `, 'tests');
    const reportDir = await question(
      `report output directory: (reports) `,
      'reports'
    );

    const config = {
      baseDir: baseDir,
      report: {
        outputDir: reportDir,
        options: {
          index: {
            template: '',
          },
          htmlextra: {},
        },
      },
      target: [],
    };

    while (true) {
      const targetSite = await question(
        `target site name: (empty to finish) `,
        ''
      );
      if (targetSite === '') break;
      config.target.push({
        name: targetSite,
        environment: '',
        globals: '',
        collections: [],
      });
      console.log(`Added target '${targetSite}'`);
    }

    // output config
    const configJson = JSON.stringify(config, null, 2);
    console.log(configJson);

    await fs.promises.writeFile(configFile, configJson);
    console.log(`
Output config file to ${configFile}`);

    // make directories
    await fs.promises.mkdir(baseDir, { recursive: true });
    await fs.promises.mkdir(reportDir, { recursive: true });
    await Promise.allSettled(
      config.target.map((target) =>
        Promise.allSettled(
          [
            `${baseDir}/${target.name}/collections`,
            `${baseDir}/${target.name}/environments`,
            `${baseDir}/${target.name}/fixtures`,
          ].map((dir) => fs.promises.mkdir(dir, { recursive: true }))
        )
      )
    );

    process.exit(0);
  })();
};
