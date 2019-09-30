/* eslint-env mocha */

const sinon = require('sinon');
const { assert } = require('chai');
const testEvent = require('../data/sendEmail.json');
const { dynamoDB, SNS } = require('../../src/helpers/aws');

describe('emailSend', () => {
	let handler;
	const stubs = {};

	before(() => {
		stubs.snsStub = sinon.stub(SNS, 'publish').returns({
			promise: () => true,
		});

		stubs.queryStub = sinon.stub(dynamoDB, 'query');
		stubs.putStub = sinon.stub(dynamoDB, 'put').returns({
			promise: () => true,
		});

		handler = require('../../src/lambdas/emailSend').handler; // eslint-disable-line
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

	it('should return 400 for wrong input', (done) => {
		const malformedEvent = { ...testEvent, body: JSON.stringify({ wrong: 'value' }) };

		handler(malformedEvent, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 400);

			done();
		});
	});

	it('should return 400 for missing "to" field', (done) => {
		const event = {
			...testEvent,
			body: JSON.stringify({
				subject: 'test',
				body: 'test',
			}),
		};

		handler(event, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 400);

			done();
		});
	});

	it('should return 400 for missing body field', (done) => {
		const event = {
			...testEvent,
			body: JSON.stringify({
				to: 'test@test.com',
			}),
		};

		handler(event, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 400);

			done();
		});
	});

	it('should return 200 for correct email', (done) => {
		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 200);

			done();
		});
	});
});
