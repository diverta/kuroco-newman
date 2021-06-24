#!/usr/bin/env node

'use strict';

const { NewmanConfig } = require('../config');
const { ReportGenerator } = require('../reports');

const newmanConfig = NewmanConfig.load();
const reportGenerator = new ReportGenerator(newmanConfig);

reportGenerator.writeIndex(reportGenerator.generateIndexHtml());
