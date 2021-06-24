const appRoot = require('app-root-path');
const glob = require('glob');

class Files {
  constructor(newmanConfig) {
    this.newmanConfig = newmanConfig;
    this.absoluteBaseDir = appRoot.resolve(this.newmanConfig.baseDir);
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
    // TODO: Add validation to check whether collections are put with valid directory structure
    return [];
  }
}

module.exports = Files;
