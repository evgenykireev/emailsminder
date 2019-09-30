/* eslint-env mocha */

const sinon = require('sinon');
const { assert } = require('chai');
const testSendGrid = require('../data/webhookSendgrid.json');
const testMailGun = require('../data/webhookMailGun.json');
const testMailGunMultipart = require('../data/webhookMailGunMultipart.json');
const { dynamoDB } = require('../../src/helpers/aws');

describe('emailWebhook', () => {
	let handler;
	const stubs = {};

	before(() => {
		stubs.updateStub = sinon.stub(dynamoDB, 'update').returns({
			promise: () => ({
				Attributes: {},
			}),
		});

		handler = require('../../src/lambdas/emailWebhook').handler; // eslint-disable-line
	});

	after(() => {
		Object.keys(stubs).forEach((stub) => stubs[stub].restore());
	});

	it('should return handler', () => {
		assert.typeOf(handler, 'function', 'we have a handler');
	});

	it('should return 400 for missing input', (done) => {
		handler({}, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 400);

			done();
		});
	});

	it('should return 404 for non-existing provider', (done) => {
		const malformedEvent = {
			...testMailGun,
			pathParameters: {
				provider: 'blah',
			},
		};

		handler(malformedEvent, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 404);

			done();
		});
	});

	it('should return 200 for mailgun request', (done) => {
		handler(testMailGun, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 200);

			done();
		});
	});

	it('should return 200 for sendgrid request', (done) => {
		handler(testSendGrid, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 200);

			done();
		});
	});

	it('should return 200 for valid mailgun multipart request', (done) => {
		handler(testMailGunMultipart, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 200);

			done();
		});
	});
});
