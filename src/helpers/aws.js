const DynamoDB = require('aws-sdk/clients/dynamodb'); // eslint-disable-line import/no-extraneous-dependencies
const SNS = require('aws-sdk/clients/sns'); // eslint-disable-line import/no-extraneous-dependencies
const { awsRegion } = require('../config');

const awsConfig = {
	region: awsRegion,
};

const dynamoInstance = new DynamoDB(awsConfig);

module.exports = {
	SNS: new SNS(awsConfig),
	dynamoDB: new DynamoDB.DocumentClient({ service: dynamoInstance }),
};
