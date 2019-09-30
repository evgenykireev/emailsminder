const { ERROR_404 } = require('../APIError');
const { validatePathParams } = require('../email/validator');
const { getEmail } = require('../email/model');
const { HTTPLambda } = require('../helpers/lambda');

const handler = async ({ pathParameters }) => {
	const { emailID } = validatePathParams(pathParameters, ['emailID']);
	const email = await getEmail(emailID);

	if (!email) {
		throw ERROR_404;
	}

	return email;
};

module.exports = {
	handler: (event, context, callback) => {
		HTTPLambda(event, callback, handler);
	},
};
