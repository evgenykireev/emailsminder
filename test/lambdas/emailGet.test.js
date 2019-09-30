/* eslint-env mocha */

const sinon = require('sinon');
const { assert } = require('chai');
const testEvent = require('../data/getEmail.json');
const { dynamoDB } = require('../../src/helpers/aws');

describe('emailGet', () => {
	let handler;
	const stubs = {};

	before(() => {
		stubs.queryStub = sinon.stub(dynamoDB, 'query');

		handler = require('../../src/lambdas/emailGet').handler; // eslint-disable-line
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
		const malformedEvent = {
			pathParameters: {
				emailID: [1, 2, 2],
			},
		};

		handler(malformedEvent, {}, (error, result) => {
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 400);

			done();
		});
	});

	it('should return 200 for existing email', (done) => {
		stubs.queryStub.returns({
			promise: () => ({
				Items: [{
					id: 123,
				}],
			}),
		});

		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 200);

			done();
		});
	});

	it('should return 404 for non existing email', (done) => {
		stubs.queryStub.returns({
			promise: () => ({
				Items: [],
			}),
		});

		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 404);

			done();
		});
	});

	it('should return 500 for broken backend', (done) => {
		stubs.queryStub.throws('Error');

		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'object', 'we have a result');
			assert.propertyVal(result, 'statusCode', 500);

			done();
		});
	});
});
