const { GlobSync } = require('glob');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

class Files {
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
    return `${this.absoluteBaseDir}/${targetName}/apis/${id}/collections/${type}`;
  }

  // getAllRunnableCollections() {
  //   const collections = this.newmanConfig.target.reduce((list, target) => {
  //     return [
  //       ...list,
  //       ...target.apis.map((api) => {
  //         return Object.keys(api.collections).reduce(
  //           (paths, type) => [
  //             ...paths,
  //             ...glob.sync(
  //               `${this.getCollectionsDir(target.name, api.id, type)}/${
  //                 api.collections[type]
  //               }`
  //             ),
  //           ],
  //           []
  //         );
  //       }, []),
  //     ];
  //   }, []);
  //   return [...new Set(collections.flat())];
  // }

  validateDirectoryStructure() {
    for (const target of this.newmanConfig.target) {
      const environmentFile = path.join(
        this.getEnvironmentsDir(target.name),
        target.environment
      );
      // environment file validation
      if (!fs.existsSync(environmentFile)) {
        const relPath = environmentFile.replace(`${process.cwd()}/`, '');
        return [`Environment file not found: ${relPath}`];
      }
      for (const api of target.apis) {
        for (const testType in api.collections) {
          const collectionsDir = this.getCollectionsDir(
            target.name,
            api.id,
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
          // const collectionFilesPattern = path.join(
          //   this.getCollectionsDir(target.name, api.id, testType),
          //   api.collections[testType]
          // );
        }
      }
    }
    return [];
  }
}

module.exports = Files;
