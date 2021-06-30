#!/usr/bin/env node

/**
 * Script to fetch openapi.json from kuroco-dev
 */
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const queryString = require('query-string');

const config = require(path.resolve(process.cwd(), 'kuroco-api.config.json'));
const args = process.argv.slice(2);

const targetName = args[0];
if (targetName === undefined) {
  console.error('Target name must be specified');
  process.exit(1);
}
if (config[targetName] === undefined) {
  console.error('Configuration for specified target not found');
  process.exit(1);
}

if (!args.includes('-i') && !args.includes('--id')) {
  console.error('Id must be specified');
  process.exit(1);
}
if (!args.includes('-k') && !args.includes('--key')) {
  console.error('SDK key must be specified');
  process.exit(1);
}

let apiId;
let sdkKey;
let outputPath = './openapi.json';

for (const [i, v] of args.entries()) {
  const nextVal = args[i + 1];
  switch (v) {
    case '-i':
    case '--id':
      if (!Number.isInteger(parseInt(nextVal))) {
        console.error('Id should be number');
        process.exit(1);
      }
      apiId = nextVal;
      break;
    case '-k':
    case '--key':
      if (nextVal === undefined) {
        console.error('SDK key must be specified: -k SDK_KEY_FOR_YOUR_API');
        process.exit(1);
      }
      sdkKey = nextVal;
      break;
    case '-o':
    case '--output':
      if (nextVal === undefined) {
        console.error('Output path must be specified: -o path/to/openapi.json');
        process.exit(1);
      }
      outputPath = outputPath;
      break;
    default:
      break;
  }
}

const apiUrl = config[targetName].url;
const lang = config[targetName].lang;

(async () => {
  // Get openapi data
  const openapi_response = await fetch(
    `${apiUrl}/direct/rcms_api/openapi/?api_id=${apiId}&_lang=${lang}&sdk_key=${sdkKey}`,
    {
      method: 'GET',
    }
  )
    .then((res) => res.json())
    .catch((err) => {
      console.error(`[Error] ` + JSON.stringify(err));
      process.exit(1);
    });

  // Save
  const openapi_json = JSON.stringify(openapi_response.openapi_data, null, 4);
  fs.writeFile(outputPath, openapi_json, (err) => {
    if (err) {
      console.error(`[Error] ` + err);
      process.exit(1);
    } else {
      console.log(`[Suceess] output file: ${outputPath}`);
    }
  });
})();
