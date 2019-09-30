/**
 * This module is imported by serverless.yml to get the correct config
 */

/**
 * Sets APP_ENV environment variable to --stage value.
 */

const stageIndex = process.argv.indexOf('--stage');

if (stageIndex !== -1 && stageIndex !== process.argv.length - 1) {
	process.env.APP_ENV = process.argv[stageIndex + 1];
}

const config = require('./index.js');

module.exports = () => config;
