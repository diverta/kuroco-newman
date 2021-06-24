const fs = require('fs');
const appRoot = require('app-root-path');
const NewmanConfigError = require('./NewmanConfigError.js');

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
    // TODO: The other validations
    return [];
  }
}

module.exports = NewmanConfig;
