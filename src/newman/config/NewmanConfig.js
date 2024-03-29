const fs = require('fs');
const path = require('path');
const NewmanConfigError = require('./NewmanConfigError.js');
const Files = require('../runner/Files.js');

const configFileName = 'kuroco-newman.config.json';

class NewmanConfig {
  static load() {
    const configPath = path.resolve(process.cwd(), configFileName);
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

    // baseDir
    if (typeof newmanConfig.baseDir !== 'string') {
      return [
        "String 'baseDir' should be set on the top level of configuration object",
      ];
    }
    if (!fs.existsSync(newmanConfig.baseDir)) {
      return [`Base directory not found: ${newmanConfig.baseDir}`];
    }

    // report
    if (typeof newmanConfig.report !== 'object') {
      return [
        "Object 'report' should be set on the top level of configuration object",
      ];
    }
    if (
      typeof newmanConfig.report.outputDir !== 'string' ||
      newmanConfig.report.outputDir === ''
    ) {
      return ["'report.outputDir' should be a string and non-empty"];
    }
    if (typeof newmanConfig.report.options === 'object') {
      if (typeof newmanConfig.report.options.index === 'object') {
        if (newmanConfig.report.options.index.hasOwnProperty('template')) {
          if (
            typeof newmanConfig.report.options.index.template !== 'string' ||
            newmanConfig.report.options.index.template === '' ||
            !fs.existsSync(newmanConfig.report.options.index.template)
          ) {
            return ["'index' template file not found"];
          }
        }
      }
    }

    // target
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
      ['environment', 'globals'].forEach((key) => {
        if (target[key] !== undefined && typeof target[key] !== 'string') {
          return [`'${key}' should be a string`];
        }
      });
      const targetName =
        typeof target.alias === 'string' ? target.alias : target.name;
      if (targetNames.includes(targetName)) {
        return [`Name or alias '${targetName}' is duplicated`];
      }
      targetNames.push(targetName);
      if (!Array.isArray(target.collections)) {
        return ["Array 'collections' should be set for each target"];
      }
      for (const collection of target.collections) {
        if (typeof target !== 'object') {
          return ["Each item of array 'collections' should be an object"];
        }
        if (collection.id !== undefined && typeof collection.id !== 'string') {
          return ["String 'id' should be set for each item of 'collections'"];
        }
        if (typeof collection.files !== 'object') {
          return [
            "Object 'files' should be set for each item of 'collections'",
          ];
        }
        for (const type in collection.files) {
          // glob pattern: collection.files[type]
          if (typeof collection.files[type] !== 'string') {
            return ["Each item of object 'files' should be a string"];
          }
        }
      }
    }
    return [];
  }
}

module.exports = NewmanConfig;
