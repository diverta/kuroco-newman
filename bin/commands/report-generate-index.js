#!/usr/bin/env node

'use strict';

const { NewmanConfig } = require('../../src/newman/config');
const { ReportGenerator } = require('../../src/newman/reports');

module.exports = () => {
  const newmanConfig = NewmanConfig.load();
  const reportGenerator = new ReportGenerator(newmanConfig);

  reportGenerator.writeIndex(reportGenerator.generateIndexHtml());
};
