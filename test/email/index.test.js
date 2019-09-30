/* eslint-env mocha */

const sinon = require('sinon');
const { assert } = require('chai');
const { dynamoDB, SNS } = require('../../src/helpers/aws');

describe('email', () => {
	let email;
	const stubs = {};

	before(() => {
		stubs.snsStub = sinon.stub(SNS, 'publish');
		stubs.putStub = sinon.stub(dynamoDB, 'put').returns({
			promise: () => true,
		});

		email = require('../../src/email'); // eslint-disable-line
	});

	after(() => {
		Object.keys(stubs).forEach((stub) => stubs[stub].restore());
	});

	it('should queue email', async () => {
		stubs.putStub.returns({
			promise: () => true,
		});

		stubs.snsStub.returns({
			promise: () => true,
		});

		const result = await email.queueEmail({
			to: ['test@test.com'],
			subject: 'test',
		});

		assert.typeOf(result, 'string', 'we have id');
		assert.equal(result.length, 36, 'correct id');

		return null;
	});

	it('should throw error if DB is failing', async () => {
		stubs.putStub.returns({
			promise: () => false,
		});

		stubs.snsStub.returns({
			promise: () => true,
		});

		let error;
		try {
			await email.queueEmail({
				to: ['test@test.com'],
				subject: 'test',
			});
		} catch (e) {
			error = e;
		}

		assert.typeOf(error, 'error', 'got error');
		return null;
	});

	it('should throw error if SNS is failing', async () => {
		stubs.putStub.returns({
			promise: () => new Promise((resolve, reject) => {
				reject(new Error('Test'));
			}),
		});

		let error;
		try {
			await email.queueEmail({
				to: ['test@test.com'],
				subject: 'test',
			});
		} catch (e) {
			error = e;
		}

		assert.typeOf(error, 'error', 'got error');
		return null;
	});
});
