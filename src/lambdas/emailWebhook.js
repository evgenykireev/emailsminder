const { ERROR_404 } = require('../APIError');
const { HTTPLambda } = require('../helpers/lambda');
const { handleWebhook } = require('../email');
const { getProviderByName } = require('../email/providers');
const { validateWebhookBody } = require('../email/validator');

const handler = async (event) => {
	const { provider, data } = validateWebhookBody(event);
	const providerInstance = getProviderByName(provider);
	if (!providerInstance) {
		throw ERROR_404;
	}

	return handleWebhook(providerInstance, data);
};

module.exports = {
	handler: (event, context, callback) => {
		HTTPLambda(event, callback, handler);
	},
};
