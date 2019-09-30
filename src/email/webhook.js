const axios = require('axios');
const logger = require('../helpers/logger');

/**
 * Triggers webhook call.
 *
 * @todo Ideally it should be a separate λ function that:
 * - handles response code
 * - retries if needed
 * - batches updates
 *
 * @param id
 * @param processingStatus
 * @param webhook
 * @return {Promise.<void>}
 */
const triggerWebhook = async ({ id, processingStatus, webhook }) => {
	try {
		await axios.post(webhook, {
			id,
			event: processingStatus,
		});
	} catch (error) {
		logger.error(`Failed to trigger webhook ${JSON.stringify(error)}`);
	}
};

module.exports = {
	triggerWebhook,
};
