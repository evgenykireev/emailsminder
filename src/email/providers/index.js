const mailgun = require('./mailgun');
const sendgrid = require('./sendgrid');

const providers = {
	mailgun,
	sendgrid,
};

/**
 * Gets provider by name.
 *
 * @param name
 * @return {*}
 */
const getProviderByName = (name) => {
	if (!providers.hasOwnProperty(name)) {
		return null;
	}

	return {
		name,
		...providers[name],
	};
};

/**
 * Returns next email provider to try.
 *
 * @param processingResult
 * @return {*}
 */
const getNextProvider = (processingResult) => {
	const finishedProviders = {};
	processingResult.forEach(({ provider }) => {
		finishedProviders[provider] = true;
	});

	const providersToTry = Object.keys(providers).filter((elem) => !finishedProviders.hasOwnProperty(elem));

	if (!providersToTry.length) {
		return null;
	}

	return getProviderByName(providersToTry[0]);
};

/**
 * Setup webhooks for each provider.
 *
 * @param url
 * @return {Promise.<{}>}
 */
const enableWebhook = async (url) => {
	const results = {};
	await Promise.all(Object.keys(providers).map(async (providerName) => {
		results[providerName] = await providers[providerName].enableWebhook(`${url}${providerName}`);
	}));

	return results;
};

module.exports = {
	getNextProvider,
	getProviderByName,
	enableWebhook,
	providers,
};
