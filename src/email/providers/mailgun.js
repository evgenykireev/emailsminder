const axios = require('axios');
const querystring = require('querystring');
const { sendFrom } = require('../../config');
const { STATUS_FAILED, STATUS_FINISHED, STATUS_PROCESSING } = require('../model');

const { MAILGUN_DOMAIN, MAILGUN_API_KEY } = process.env;

const axiosInstance = axios.create({
	baseURL: 'https://api.mailgun.net/v3',
	timeout: 5000, // ms
	auth: {
		username: 'api',
		password: MAILGUN_API_KEY,
	},
});

/**
 * Enables webhook.
 * @param url
 * @return {Promise.<{}>}
 */
const enableWebhook = async (url) => {
	const hooks = ['drop', 'deliver', 'bounce'];
	const results = {};

	await Promise.all(hooks.map(async (hook) => {
		let result;
		try {
			const { status } = await axiosInstance.post(
				`/domains/${MAILGUN_DOMAIN}/webhooks`,
				querystring.stringify({ id: hook, url }),
			);

			result = status === 200 ? 'OK' : `Failed - ${status}`;
		} catch (error) {
			result = error.message;
		}

		results[hook] = result;
	}));

	return results;
};

const sendEmail = async ({
	id, to, cc, bcc, subject, body,
}) => {
	const email = {
		to: to.join(','),
		subject,
		text: body,
		from: sendFrom,
		'v:emailID': id,
	};

	if (cc && cc.length) {
		email.cc = cc.join(',');
	}

	if (bcc && bcc.length) {
		email.bcc = bcc.join(',');
	}

	const { status, data } = await axiosInstance.post(
		`/${MAILGUN_DOMAIN}/messages`,
		querystring.stringify(email),
	);

	return status === 200 ? data.id : false;
};

const handleWebhook = (data) => {
	const { emailID, event } = data;
	if (!emailID) {
		throw new Error('Missing emailID');
	}

	let hookStatus = STATUS_PROCESSING;
	if (['bounced', 'dropped'].includes(event)) {
		hookStatus = STATUS_FAILED;
	} else if (['delivered'].includes(event)) {
		hookStatus = STATUS_FINISHED;
	}

	return [{
		emailID,
		hookStatus,
	}];
};

module.exports = {
	sendEmail,
	enableWebhook,
	handleWebhook,
};
