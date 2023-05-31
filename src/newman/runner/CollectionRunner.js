const glob = require('glob');
const path = require('path');
const newman = require('newman');

const Files = require('./Files.js');
const ReportGenerator = require('../reports/ReportGenerator');

class CollectionRunner {
  newmanConfig;
  absoluteBaseDir;

  constructor(newmanConfig) {
    this.newmanConfig = newmanConfig;

    this.absoluteBaseDir = path.resolve(
      process.cwd(),
      this.newmanConfig.baseDir
    );

    this.htmlextraConfig = this.getHtmlextraConfig(newmanConfig);
    this.files = new Files(newmanConfig);
    this.reportGenerator = new ReportGenerator(newmanConfig);
  }

  getHtmlextraConfig(newmanConfig) {
    if (typeof newmanConfig.report.options.htmlextra !== 'object') {
      return {};
    }
    // Ignore 'export' option
    const htmlextraConfig = Object.keys(
      newmanConfig.report.options.htmlextra
    ).reduce((conf, key) => {
      return {
        ...conf,
        ...(key === 'export'
          ? {}
          : { [key]: newmanConfig.report.options.htmlextra[key] }),
      };
    }, {});
    return htmlextraConfig;
  }

  run(
    collectionFile,
    environmentFile,
    globalsFile,
    targetSite,
    id,
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
          globals: globalsFile,
          reporters: ['cli', 'htmlextra'],
          reporter: {
            htmlextra: {
              ...this.htmlextraConfig,
              export: Files.joinPath(
                reportRootPath,
                targetName,
                id,
                testType,
                `${collectionName}.html`
              ),
            },
          },
          workingDir: `${this.absoluteBaseDir}/${targetSite}`,
        },
        (err, summary) => {
          this.reportGenerator.writeSummary(
            Files.joinPath(targetName, id, testType),
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

    const allRunArguments = this.newmanConfig.target.flatMap((site) =>
      this.makeSiteCollectionsRunArguments(site)
    );

    return (async () => {
      const allResults = [];
      for (const runArguments of allRunArguments) {
        try {
          const result = await this.run(...Object.values(runArguments));
          allResults.push({ status: 'fulfilled', value: result });
        } catch (e) {
          allResults.push({ status: 'rejected', reason: e });
        }
      }
      const reportIndexHtml = this.reportGenerator.generateIndexHtml();
      this.reportGenerator.writeIndex(reportIndexHtml);
      return allResults;
    })();
  }

  makeSiteCollectionsRunArguments(site) {
    const runArguments = [];
    site.collections.forEach((collection) => {
      Object.keys(collection.files).forEach((testType) => {
        const environmentFile = site.environment
          ? `${this.files.getEnvironmentsDir(site.name)}/${site.environment}`
          : '';
        const globalsFile = site.globals
          ? `${this.files.getEnvironmentsDir(site.name)}/${site.globals}`
          : '';

        const collectionFilesPattern = path.join(
          this.files.getCollectionsDir(site.name, collection.id, testType),
          collection.files[testType]
        );
        const collectionFiles = glob.sync(collectionFilesPattern);

        collectionFiles.forEach((collectionFile) => {
          runArguments.push({
            collectionFile,
            environmentFile,
            globalsFile,
            siteName: site.name,
            id: collection.id,
            testType,
            alias: site.alias,
          });
        });
      });
    });
    return runArguments;
  }
}

module.exports = CollectionRunner;
