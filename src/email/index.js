const { PROCESS_EMAIL_TOPIC: TargetArn } = process.env;
const { SNS } = require('../helpers/aws');
const { getNextProvider } = require('./providers');
const logger = require('../helpers/logger');
const {
	createEmail,
	getEmail,
	updateEmail,
	STATUS_FAILED,
	STATUS_PROCESSING,
	STATUS_FINISHED,
} = require('./model');

/**
 * Adds an email to processing queue.
 *
 * @param {string} emailID - id of email to process
 * @returns {Promise.<boolean>}
 */
const addToProcessingQueue = async (emailID) => {
	try {
		await SNS.publish({
			TargetArn,
			Message: JSON.stringify({
				emailID,
			}),
		}).promise();
	} catch (error) {
		logger.error(error);
		return false;
	}

	return true;
};

/**
 * Adds an email into a delivery queue. First creates a record in database and then publishes
 * a message into SNS topic which triggers further email processing.
 *
 * @params {{to: Array, cc: Array, bcc: Array, subject: String, body: String}} params
 * @returns {String}
 */
const queueEmail = async (email) => {
	const emailID = await createEmail(email);
	const result = await addToProcessingQueue(emailID);
	if (!result) {
		throw new Error('Error occurred while adding an email into processing queue');
	}

	return emailID;
};

/**
 * Processes an email:
 * 1. Find out next provider
 * 2. If there's one, try to process an email with it.
 * 3. Otherwise email delivery is consider to be failed.
 * 4. If processed successfully, save processing result
 * 5. Otherwise add email back to processing queue, so it will be processed by next provider.
 *
 * @params {{emailID: String}} emailID to process
 * @returns {Promise.<*>}
 */
const processEmail = async ({ emailID }) => {
	const email = await getEmail(emailID);
	if (!email) {
		return 'Email does not exist';
	}

	const processingResult = email.processingResult || [];
	const nextProvider = getNextProvider(processingResult);

	if (!nextProvider) {
		await updateEmail(emailID, { processingStatus: STATUS_FAILED });
		return 'Failed - no more providers';
	}

	const result = {
		provider: nextProvider.name,
		date: new Date().toString(),
	};

	try {
		const providerResult = await nextProvider.sendEmail(email);
		if (!providerResult) {
			throw new Error('Failed to process provider');
		}

		result.success = true;
		result.details = providerResult;
	} catch (error) {
		logger.error(error);
		result.success = false;
		result.details = error.message;
	}

	await updateEmail(emailID, { processingStatus: STATUS_PROCESSING, processingResult: [result] });
	if (!result.success) {
		await addToProcessingQueue(emailID);
	}

	return result;
};

/**
 * Handles a webhook update.
 * 1. Calls provider to determine status of the hook.
 * 2. If the hook is "finished" update status of email to "finished"
 * 3. If the hook is "failing" add email back to processing queue to try next provider.
 *
 * @param provider
 * @param webhookData
 * @return {Promise.<boolean>}
 */
const handleWebhook = async (provider, webhookData) => {
	let results;
	try {
		results = provider.handleWebhook(webhookData);
	} catch (e) {
		return e.message;
	}

	await Promise.all(results.map(async (result) => {
		const { emailID, hookStatus } = result;
		if (!emailID) {
			return null;
		}

		const emailData = {
			processingResult: [{
				provider: provider.name,
				date: new Date().toString(),
				result: hookStatus,
			}],
		};

		if (hookStatus === STATUS_FINISHED) {
			emailData.processingStatus = STATUS_FINISHED;
		}

		await updateEmail(emailID, emailData);

		if (hookStatus === STATUS_FAILED) {
			await addToProcessingQueue(emailID);
		}

		return null;
	}));

	return true;
};

module.exports = {
	queueEmail,
	processEmail,
	handleWebhook,
};
