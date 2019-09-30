const { processEmail } = require('../email');
const { validateProcessEmailParams } = require('../email/validator');

const handler = async (event, context, callback) => {
	if (Object !== event.constructor || !event.hasOwnProperty('Records') || Array !== event.Records.constructor) {
		return callback(null, false);
	}

	const results = [];
	await Promise.all(event.Records.map(async (record) => {
		let result;
		try {
			const params = validateProcessEmailParams(record);
			result = await processEmail(params);
		} catch (error) {
			result = error.message;
		}

		results.push(result);
		return null;
	}));

	callback(null, results);
	return null;
};

module.exports = {
	handler,
};
