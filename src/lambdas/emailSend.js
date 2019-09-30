const { validateRequestBody } = require('../email/validator');
const { queueEmail } = require('../email');
const { HTTPLambda } = require('../helpers/lambda');

const handler = async (event) => {
	const emailParams = validateRequestBody('sendEmail', event);
	const emailId = await queueEmail(emailParams);
	return { emailId };
};

module.exports = {
	handler: (event, context, callback) => {
		HTTPLambda(event, callback, handler);
	},
};
