#!/usr/bin/env node

'use strict';

const fs = require('fs');
const readline = require('readline');
const Converter = require('openapi-to-postmanv2');

const convert = (openapi) =>
  new Promise((resolve, reject) => {
    Converter.convert({ type: 'string', data: openapi }, {}, (err, result) => {
      if (!result.result) {
        reject(result.reason);
      } else {
        resolve(result.output[0].data);
      }
    });
  });

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = () =>
  new Promise((resolve, reject) => {
    readlineInterface.question('> ', (answer) => {
      if (answer) {
        resolve(answer);
      } else {
        reject();
      }
    });
  });

module.exports = (openapiFile, collectionFile, output = null) => {
  if (!openapiFile || !collectionFile) {
    console.error(`Please specify openapi & collection file`);
    process.exit(1);
  }
  if (output == null) {
    output = collectionFile;
  }

  const openapiData = fs.readFileSync(openapiFile, { encoding: 'utf8' });

  const postmanCollectionJson = fs.readFileSync(collectionFile, {
    encoding: 'utf8',
  });
  const postmanCollection = JSON.parse(postmanCollectionJson);

  (async () => {
    const converted = await convert(openapiData);
    const endpoints = new Set();
    const postmanItems = {};
    const openapiItems = {};
    const parseData = (obj, items) => {
      if (obj.hasOwnProperty('item')) {
        obj.item.forEach((child) => parseData(child, items));
      } else if (obj.hasOwnProperty('request')) {
        const endpoint = '/' + obj.request.url.path.join('/');
        endpoints.add(endpoint);
        items[endpoint] = obj;
      }
    };
    parseData(postmanCollection, postmanItems);
    parseData(converted, openapiItems);

    const endpointList = [...endpoints];
    endpointList.sort();
    const added = [];
    const deleted = [];
    endpointList.forEach((endpoint) => {
      if (postmanItems[endpoint] && !openapiItems[endpoint]) {
        deleted.push(endpoint);
      } else if (!postmanItems[endpoint] && openapiItems[endpoint]) {
        added.push(endpoint);
      }
    });
    // output diff
    added.forEach((endpoint) => {
      console.log(`Added: ${endpoint}`);
    });
    deleted.forEach((endpoint) => {
      console.log(`Deleted: ${endpoint}`);
    });

    // updated collection file
    if (output) {
      let result = JSON.parse(postmanCollectionJson);
      const deleteRequest = (obj, target) => {
        if (obj.hasOwnProperty('item')) {
          obj.item = obj.item
            .filter((item) => item.name != target.name)
            .map((item) => deleteRequest(item, target));
        }
        return obj;
      };

      added.forEach((endpoint) => {
        result.item.push(openapiItems[endpoint]);
      });
      console.log('');
      for (let endpoint of deleted) {
        console.log(endpoint);
        while (true) {
          console.log('d: delete / i: ignore');
          try {
            const input = await question();
            if (input == 'd') {
              result = deleteRequest(result, postmanItems[endpoint]);
              break;
            } else if (input == 'i') {
              break;
            }
          } catch (err) {}
        }
        console.log('');
      }

      // write
      fs.writeFileSync(output, JSON.stringify(result, null, '\t'));
      console.log('Output succeeded.');
    }
    process.exit(0);
  })();
};
