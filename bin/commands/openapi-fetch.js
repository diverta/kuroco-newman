#!/usr/bin/env node

/**
 * Script to fetch openapi.json from kuroco site
 *
 * bin/fetch-openapi.js kuroco-test --id 1 -key ecaaa5243bc3e977c0acde6c56e1e111
 *
 * [kuroco-api.config.json]
 * {
 *   "kuroco-test": {
 *     "url": "https://kuroco-test.a.kuroco.app",
 *     "lang": "en"
 *   }
 * }
 */

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const queryString = require('query-string');

module.exports = (targetName, apiId, sdkKey, outputPath = './openapi.json') => {
  const config = require(path.resolve(process.cwd(), 'kuroco-api.config.json'));

  if (targetName === undefined) {
    console.error('Target name must be specified');
    process.exit(1);
  }
  if (config[targetName] === undefined) {
    console.error('Configuration for specified target not found');
    process.exit(1);
  }

  if (!Number.isInteger(parseInt(apiId))) {
    console.error('Id should be number');
    process.exit(1);
  }

  const apiUrl = config[targetName].url;
  const lang = config[targetName].lang || null;

  (async () => {
    const queries = {
      api_id: apiId,
      _lang: lang,
      sdk_key: sdkKey,
    };
    // Get openapi data
    const openapi_response = await fetch(
      `${apiUrl}/direct/rcms_api/openapi/?` +
        queryString.stringify(queries, { skipNull: true }),
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
};
