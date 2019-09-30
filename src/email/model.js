const { EMAIL_TABLE: TableName } = process.env;
const { dynamoDB } = require('../helpers/aws');
const { triggerWebhook } = require('./webhook');

const STATUS_QUEUED = 'queued';
const STATUS_FAILED = 'failed';
const STATUS_PROCESSING = 'processing';
const STATUS_FINISHED = 'delivered';

/**
 * Generates UUID RFC4122
 *
 * @see Credits go to broofa https://stackoverflow.com/posts/2117523/revisions
 * @returns {String}
 */
const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
	/* eslint-disable */
	const r = Math.random() * 16 | 0;
	const v = c === 'x' ? r : (r & 0x3 | 0x8);
	/* eslint-enable */

	return v.toString(16);
});

/**
 * Adds a new email into dynamoDB table.
 *
 * @params {{
 * to: Array,
 * cc: Array,
 * bcc: Array,
 * webhook: String,
 * subject: String,
 * body: String}} email
 *
 * @return {Promise.<String>}
 */
const createEmail = async ({
	to, cc, bcc, webhook, subject, body,
}) => {
	const emailID = generateId();
	const Item = {
		id: emailID,
		processingStatus: STATUS_QUEUED,
		created: new Date().toString(),
		processingResult: [],
		to,
		body,
	};

	/**
	 * An AttributeValue may not contain an empty string, so only add optional attributes when set.
	 */
	if (cc && cc.length) {
		Item.cc = cc;
	}

	if (bcc && bcc.length) {
		Item.bcc = bcc;
	}

	if (subject) {
		Item.subject = subject;
	}

	if (webhook) {
		Item.webhook = webhook;
	}

	const putResult = await dynamoDB.put({
		TableName,
		Item,
	}).promise();

	if (!putResult) {
		throw new Error('Error occurred while adding new email');
	}

	return emailID;
};

/**
 * Returns an email from DB.
 *
 * @param {string} emailID - id of email to get
 * @returns {Promise.<*>}
 */
const getEmail = async (emailID) => {
	const { Items } = await dynamoDB.query({
		TableName,
		KeyConditionExpression: 'id = :id',
		ExpressionAttributeValues: {
			':id': emailID,
		},
	}).promise();

	if (!Items || !Items.length) {
		return null;
	}

	return Items[0];
};

/**
 * Updates an email in DB. In case processingStatus attribute is updated and email
 * has a webhook attached, calls this webhook as well.
 *
 * @param emailID
 * @param data
 * @return {Promise.<boolean>}
 */
const updateEmail = async (emailID, data) => {
	const updateKeys = [];
	const updateValues = {};

	Object.keys(data).forEach((key) => {
		const updateValue = key === 'processingResult' ? 'list_append(processingResult, :processingResult)' : `:${key}`;
		updateKeys.push(`${key} = ${updateValue}`);
		updateValues[`:${key}`] = data[key];
	});

	const { Attributes: item } = await dynamoDB.update({
		TableName,
		Key: {
			id: emailID,
		},
		UpdateExpression: `set ${updateKeys.join(', ')}`,
		ExpressionAttributeValues: updateValues,
		ReturnValues: 'ALL_NEW',
	}).promise();

	if (data.hasOwnProperty('processingStatus') && item.webhook) {
		await triggerWebhook(item);
	}

	return true;
};

module.exports = {
	STATUS_FAILED,
	STATUS_QUEUED,
	STATUS_FINISHED,
	STATUS_PROCESSING,

	getEmail,
	createEmail,
	updateEmail,
};
