const glob = require('glob');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const moment = require('moment-timezone');

const Files = require('../runner/Files.js');

class ReportGenerator {
  constructor(newmanConfig) {
    const baseDir = path.resolve(process.cwd(), newmanConfig.report.outputDir);
    this.reportsPath = {
      baseDir,
      summaryDir: `${baseDir}/summary`,
    };

    this.reportIndexConfig = this.getReportIndexConfig(newmanConfig);
    this.mapping = this.getNewmanConfigTargetMapping(newmanConfig);

    this.files = new Files(newmanConfig);
  }

  getReportIndexConfig(newmanConfig) {
    if (typeof newmanConfig.report.options.index !== 'object') {
      return {};
    }
    const indexConfig = Object.keys(newmanConfig.report.options.index).reduce(
      (conf, key) => {
        return {
          ...conf,
          ...{
            [key]:
              key === 'template'
                ? path.resolve(
                    process.cwd(),
                    newmanConfig.report.options.index[key]
                  )
                : newmanConfig.report.options.index[key],
          },
        };
      },
      {}
    );
    // Use default template if custom template is not configured
    if (!indexConfig.template) {
      indexConfig.template = path.resolve(
        __dirname,
        'templates/reports-top.hbs'
      );
    }
    if (!indexConfig.title) {
      indexConfig.title = 'Kuroco Newman Test Reports';
    }
    if (!indexConfig.browserTitle) {
      indexConfig.browserTitle = 'Kuroco Newman Test Reports';
    }
    if (!indexConfig.timezone) {
      indexConfig.timezone = 'Asia/Tokyo';
    }
    return indexConfig;
  }

  getNewmanConfigTargetMapping(newmanConfig) {
    const mapping = {};
    newmanConfig.target.forEach((target) => {
      const targetName =
        typeof target.alias === 'string' ? target.alias : target.name;
      mapping[targetName] = target;
    });
    return mapping;
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
    const datetime = moment()
      .tz(this.reportIndexConfig.timezone)
      .format('YYYY-MM-DD HH:mm:ss z');

    const reports = {};

    glob
      .sync(`${this.reportsPath.baseDir}/*/*/*/*.html`)
      .forEach((absolutePath) => {
        const relPath = absolutePath.replace(`${process.cwd()}/`, '');
        const href = relPath.replace(/^(\.\/)?reports\//, '');
        const [site, id, type, fileName] = href.split('/', 4);
        const collectionName = fileName.replace(/\.html$/, '');
        if (!reports.hasOwnProperty(site)) {
          const targetConfig = this.mapping[site];
          reports[site] = { apis: {} };
          if (typeof targetConfig.alias === 'string') {
            reports[site].originalName = targetConfig.name;
          }
        }
        if (!reports[site].apis.hasOwnProperty(id)) {
          reports[site].apis[id] = {};
        }
        if (!reports[site].apis[id].hasOwnProperty(type)) {
          reports[site].apis[id][type] = {};
        }
        // check summary
        const summary = JSON.parse(
          fs.readFileSync(
            `${this.reportsPath.summaryDir}/${site}/${id}/${type}/${collectionName}.json`
          )
        );

        reports[site].apis[id][type][collectionName] = {
          href: href,
          failures: summary.run.failures.length,
        };
      });

    const props = {
      reports: reports,
      updatedAt: datetime,
      title: this.reportIndexConfig.title,
      browserTitle: this.reportIndexConfig.browserTitle,
    };

    // GitHub Actions info
    if (process.env.GITHUB_ACTIONS) {
      props.GitHubActions = {
        workflowURL: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
      };
    }

    const template = handlebars.compile(
      fs.readFileSync(this.reportIndexConfig.template, 'utf-8').toString()
    );

    const output = template(props);

    return output;
  }
}

module.exports = ReportGenerator;
