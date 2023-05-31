const { GlobSync } = require('glob');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

class Files {
  newmanConfig;
  absoluteBaseDir;

  constructor(newmanConfig) {
    this.newmanConfig = newmanConfig;
    this.absoluteBaseDir = path.resolve(
      process.cwd(),
      this.newmanConfig.baseDir
    );
  }

  getEnvironmentsDir(targetName) {
    return `${this.absoluteBaseDir}/${targetName}/environments`;
  }

  getCollectionsDir(targetName, id, type) {
    return Files.joinPath(
      this.absoluteBaseDir,
      targetName,
      'collections',
      id,
      type
    );
  }

  validateDirectoryStructure() {
    for (const target of this.newmanConfig.target) {
      let environmentFile = '';
      if (target.environment !== undefined) {
        environmentFile = path.join(
          this.getEnvironmentsDir(target.name),
          target.environment
        );
        // environment file validation
        if (!fs.existsSync(environmentFile)) {
          const relPath = environmentFile.replace(`${process.cwd()}/`, '');
          return [`Environment file not found: ${relPath}`];
        }
      }

      for (const collection of target.collections) {
        for (const testType in collection.files) {
          const collectionsDir = this.getCollectionsDir(
            target.name,
            collection.id,
            testType
          );
          const relPath = collectionsDir.replace(`${process.cwd()}/`, '');
          try {
            const collectionStat = fs.statSync(collectionsDir);
            if (!collectionStat.isDirectory()) {
              return [`Collection directory not found: ${relPath}`];
            }
          } catch (err) {
            if (err.code == 'ENOENT') {
              return [`Collection directory not found: ${relPath}`];
            } else {
              throw err;
            }
          }
        }
      }
    }
    return [];
  }

  static joinPath(...paths) {
    return path.join(
      ...paths.filter((v) => v !== undefined && v !== null && v !== '')
    );
  }
}

module.exports = Files;
