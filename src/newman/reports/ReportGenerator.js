const glob = require('glob');
const fs = require('fs');
const handlebars = require('handlebars');
const appRoot = require('app-root-path');

const Files = require('../runner/Files.js');

class ReportGenerator {
  constructor(newmanConfig) {
    const baseDir = appRoot.resolve(newmanConfig.report.outputDir);
    this.reportsPath = {
      baseDir,
      summaryDir: `${baseDir}/summary`,
    };

    this.templatesPath = this.getTemplatePathConfig(newmanConfig);

    this.files = new Files(newmanConfig);
  }

  getTemplatePathConfig(newmanConfig) {
    if (typeof newmanConfig.report.templates !== 'object') {
      return {};
    }
    const templateConfig = Object.keys(newmanConfig.report.templates).reduce(
      (conf, key) => {
        return {
          conf,
          ...{ [key]: appRoot.resolve(newmanConfig.report.templates[key]) },
        };
      },
      {}
    );
    // Use default template if custom template is not configured
    if (!templateConfig.index) {
      templateConfig.index = appRoot.resolve(
        'src/newman/reports/templates/reports-top.hbs'
      );
    }
    return templateConfig;
  }

  getRootPath() {
    return this.reportsPath.baseDir;
  }

  initReportDir() {
    fs.rmdirSync(this.reportsPath.baseDir, { recursive: true });
    fs.mkdirSync(this.reportsPath.baseDir, { recursive: true });
  }

  makeSummaryDir() {
    fs.mkdirSync(this.reportsPath.summaryDir, { recursive: true });
  }

  writeSummary(directory, collectionName, summary) {
    const fileOutputDir = `${this.reportsPath.summaryDir}/${directory}`;
    fs.mkdirSync(fileOutputDir, {
      recursive: true,
    });
    fs.writeFileSync(
      `${fileOutputDir}/${collectionName}.json`,
      JSON.stringify(summary)
    );
  }

  writeIndex(output) {
    fs.writeFileSync(`${this.reportsPath.baseDir}/index.html`, output);
  }

  generateIndexHtml() {
    // const datetime = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const date = new Date(Date.now());
    // UTC->JST convert (Date with JST doesn't work on GitHub Actions)
    date.setUTCHours(date.getUTCHours() + 9);
    const datetime = date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    });

    const reports = {};

    glob
      .sync(`${this.reportsPath.baseDir}/*/*/*/*.html`)
      .forEach((absolutePath) => {
        const relPath = absolutePath.replace(`${appRoot}/`, '');
        const href = relPath.replace(/^(\.\/)?reports\//, '');
        const [site, id, type, fileName] = href.split('/', 4);
        const collectionName = fileName.replace(/\.html$/, '');
        if (!reports.hasOwnProperty(site)) {
          reports[site] = {};
        }
        if (!reports[site].hasOwnProperty(id)) {
          reports[site][id] = {};
        }
        if (!reports[site][id].hasOwnProperty(type)) {
          reports[site][id][type] = {};
        }
        // check summary
        const summary = JSON.parse(
          fs.readFileSync(
            `${this.reportsPath.summaryDir}/${site}/${id}/${type}/${collectionName}.json`
          )
        );

        reports[site][id][type][collectionName] = {
          href: href,
          failures: summary.run.failures.length,
        };
      });

    const props = { reports: reports, updatedAt: datetime };

    // GitHub Actions info
    if (process.env.GITHUB_ACTIONS) {
      props.GitHubActions = {
        workflowURL: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
      };
    }

    const template = handlebars.compile(
      fs.readFileSync(this.templatesPath.index, 'utf-8').toString()
    );

    const output = template(props);

    return output;
  }
}

module.exports = ReportGenerator;
