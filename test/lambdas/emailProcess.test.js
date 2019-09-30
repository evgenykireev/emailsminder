/* eslint-env mocha */

const sinon = require('sinon');
const { assert } = require('chai');
const testEvent = require('../data/processEmail.json');
const { dynamoDB, SNS } = require('../../src/helpers/aws');
const { providers } = require('../../src/email/providers');

describe('emailProcess', () => {
	let handler;
	const stubs = {};

	before(() => {
		stubs.snsStub = sinon.stub(SNS, 'publish').returns({
			promise: () => true,
		});

		stubs.updateStub = sinon.stub(dynamoDB, 'update').returns({
			promise: () => ({
				Attributes: {},
			}),
		});

		stubs.queryStub = sinon.stub(dynamoDB, 'query');

		handler = require('../../src/lambdas/emailProcess').handler; // eslint-disable-line
	});

	after(() => {
		Object.keys(stubs).forEach((stub) => stubs[stub].restore());
	});

	it('should return handler', () => {
		assert.typeOf(handler, 'function', 'we have a handler');
	});

	it('should return false for missing input', (done) => {
		handler({}, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.isFalse(result, 'we have false');
			done();
		});
	});

	it('should return false for wrong input', (done) => {
		handler({ somefield: true }, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.isFalse(result, 'we have false');
			done();
		});
	});

	it('should return array result for correct input', (done) => {
		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'array', 'we have a result');

			done();
		});
	});

	it('should return array result for non existing emails', (done) => {
		stubs.queryStub.returns({
			promise: () => (false),
		});

		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'array', 'we have a result');

			done();
		});
	});

	it('should return array result for failing providers', (done) => {
		const processingResult = Object.keys(providers).map((provider) => ({ provider, success: false }));

		stubs.queryStub.returns({
			promise: () => ({
				Items: [{
					id: 123,
					processingResult,
				}],
			}),
		});

		handler(testEvent, {}, (error, result) => {
			assert.isNull(error, 'no errors');
			assert.typeOf(result, 'array', 'we have a result');

			done();
		});
	});
});
