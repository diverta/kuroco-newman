const glob = require('glob');
const path = require('path');
const newman = require('newman');

const Files = require('./Files.js');
const ReportGenerator = require('../reports/ReportGenerator');

class CollectionRunner {
  constructor(newmanConfig) {
    this.newmanConfig = newmanConfig;

    this.absoluteBaseDir = path.resolve(
      process.cwd(),
      this.newmanConfig.baseDir
    );

    this.files = new Files(newmanConfig);
    this.reportGenerator = new ReportGenerator(newmanConfig);
  }

  run(
    collectionFile,
    environmentFile,
    targetSite,
    apiId,
    testType,
    alias = null
  ) {
    const reportRootPath = this.reportGenerator.getRootPath();
    const targetName = alias || targetSite;

    const collectionName = path.parse(collectionFile).name;
    return new Promise((resolve, reject) => {
      newman.run(
        {
          collection: collectionFile,
          environment: environmentFile,
          reporters: ['cli', 'htmlextra'],
          reporter: {
            htmlextra: {
              export: `${reportRootPath}/${targetName}/${apiId}/${testType}/${collectionName}.html`,
            },
          },
          workingDir: `${this.absoluteBaseDir}/${targetSite}`,
        },
        (err, summary) => {
          this.reportGenerator.writeSummary(
            `${targetName}/${apiId}/${testType}`,
            collectionName,
            summary
          );
          if (err) {
            reject(err);
          }
          if (summary.run.failures.length > 0) {
            reject(summary);
          }
          resolve(summary);
        }
      );
    });
  }

  runAll() {
    this.reportGenerator.initReportDir();

    const runCollectionPromises = [];
    this.newmanConfig.target.forEach((site) => {
      site.apis.forEach((api) => {
        Object.keys(api.collections).forEach((testType) => {
          const environmentFile = `${this.files.getEnvironmentsDir(
            site.name
          )}/${site.environment}`;

          const collectionFilesPattern = path.join(
            this.files.getCollectionsDir(site.name, api.id, testType),
            api.collections[testType]
          );
          const collectionFiles = glob.sync(collectionFilesPattern);

          collectionFiles.forEach((collectionFile) => {
            runCollectionPromises.push(
              this.run(
                collectionFile,
                environmentFile,
                site.name,
                api.id,
                testType,
                site.alias
              )
            );
          });
        });
      });
    });

    return Promise.allSettled(runCollectionPromises).then((results) => {
      const reportIndexHtml = this.reportGenerator.generateIndexHtml();
      this.reportGenerator.writeIndex(reportIndexHtml);

      return Promise.resolve(results);
    });
  }
}

module.exports = CollectionRunner;
