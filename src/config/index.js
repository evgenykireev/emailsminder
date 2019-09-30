const stage = process.env.APP_ENV || 'dev';
const config = require('./config.json');

module.exports = {
	stage,
	...config[stage] || {},
};
