const axios = require('axios');
const querystring = require('querystring');
const { sendFrom } = require('../../config');

const { STATUS_FAILED, STATUS_FINISHED, STATUS_PROCESSING } = require('../model');

const { SENDGRID_API_KEY, SENDGRID_USER, SENDGRID_PASSWORD } = process.env;

const axiosInstance = axios.create({
	baseURL: 'https://api.sendgrid.com',
	timeout: 5000, // ms
	headers: {
		Authorization: `Bearer ${SENDGRID_API_KEY}`,
	},
});

const splitRecepient = (recepient) => {
	const matches = recepient.match(/(.*)<(.*)>/);

	return matches
		? {
			name: matches[1].trim(),
			email: matches[2].trim(),
		}
		: {
			email: recepient,
		};
};

const enableWebhook = async (url) => {
	const postData = querystring.stringify({
		url,
		api_user: SENDGRID_USER,
		api_key: SENDGRID_PASSWORD,
		name: 'eventnotify',
		processed: 1,
		dropped: 1,
		deferred: 1,
		delivered: 1,
		bounce: 1,
		click: 0,
		unsubscribe: 0,
		spamreport: 0,
	});

	return axiosInstance.post('/api/filter.setup.json', postData);
};

const sendEmail = async ({
	id, to, cc, bcc, subject, body,
}) => {
	const recipient = {
		to: to.map(splitRecepient),
	};

	if (cc && cc.length) {
		recipient.cc = cc.map(splitRecepient);
	}

	if (bcc && bcc.length) {
		recipient.bcc = bcc.map(splitRecepient);
	}

	const data = {
		personalizations: [recipient],
		subject: subject || '',
		content: [{
			type: 'text/plain',
			value: body || '',
		}],
		custom_args: {
			emailID: id,
		},
		from: splitRecepient(sendFrom),
	};

	const { status, headers } = await axiosInstance.post('/v3/mail/send', data);
	return status === 202 ? headers['x-message-id'] : false;
};

const handleWebhook = (data) => {
	if (Array !== data.constructor) {
		throw new Error('Malformed hook data');
	}

	return data.map(({ emailID, event }) => {
		let hookStatus = STATUS_PROCESSING;
		if (['bounce', 'dropped'].includes(event)) {
			hookStatus = STATUS_FAILED;
		} else if (['processed', 'delivered'].includes(event)) {
			hookStatus = STATUS_FINISHED;
		}

		return {
			emailID,
			hookStatus,
		};
	});
};

module.exports = {
	sendEmail,
	enableWebhook,
	handleWebhook,
};
