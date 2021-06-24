const fs = require('fs');
const appRoot = require('app-root-path');
const NewmanConfigError = require('./NewmanConfigError.js');
const Files = require('../runner/Files.js');

const configFileName = 'kuroco-newman.config.json';

class NewmanConfig {
  static load() {
    const configPath = appRoot.resolve(configFileName);
    if (!fs.existsSync(configPath)) {
      throw new Error([
        `Newman configuration file '${configFileName}' is not found`,
      ]);
    }
    const newmanConfig = require(configPath);
    const errors = this.validate(newmanConfig);
    if (errors.length === 0) {
      const files = new Files(newmanConfig);
      errors.push(...files.validateDirectoryStructure());
    }
    if (errors.length > 0) {
      throw new NewmanConfigError(errors);
    }
    return newmanConfig;
  }

  static validate(newmanConfig) {
    if (typeof newmanConfig !== 'object') {
      return ['Newman configuration should be exported as object'];
    }

    if (typeof newmanConfig.baseDir !== 'string') {
      return [
        "String 'baseDir' should be set on the top level of configuration object",
      ];
    }
    if (!fs.existsSync(newmanConfig.baseDir)) {
      return [`Base directory not found: ${newmanConfig.baseDir}`];
    }
    if (!Array.isArray(newmanConfig.target)) {
      return [
        "Array 'target' should be set on the top level of configuration object",
      ];
    }
    // name/alias duplicate check
    const targetNames = [];
    for (const target of newmanConfig.target) {
      if (typeof target !== 'object') {
        return ["Each item of array 'target' should be an object"];
      }
      if (typeof target.name !== 'string') {
        return ["String 'name' should be set for each target"];
      }
      if (typeof target.environment !== 'string') {
        return ["String 'environment' should be set for each target"];
      }
      const targetName =
        typeof target.alias === 'string' ? target.alias : target.name;
      if (targetNames.includes(targetName)) {
        return [`Name or alias '${targetName}' is duplicated`];
      }
      targetNames.push(targetName);
      if (!Array.isArray(target.apis)) {
        return ["Array 'apis' should be set for each target"];
      }
      for (const api of target.apis) {
        if (typeof api !== 'object') {
          return ["Each item of array 'apis' should be an object"];
        }
        if (typeof api.id !== 'string') {
          return ["String 'id' should be set for each items of 'apis'"];
        }
        if (typeof api.collections !== 'object') {
          return [
            "Object 'collections' should be set for each items of 'apis'",
          ];
        }
        for (const type in api.collections) {
          // glob pattern: api.collections[type]
          if (typeof api.collections[type] !== 'string') {
            return ["Each item of object 'collections' should be a string"];
          }
        }
      }
    }
    return [];
  }
}

module.exports = NewmanConfig;
