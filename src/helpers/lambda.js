const { APIError, ERROR_500 } = require('../APIError');
const logger = require('../helpers/logger');

/**
 * Wraps a HTTP lambda handler to return consistent results.
 *
 * @param event
 * @param callback
 * @param runner
 * @returns {Promise}
 */
const lambdaHandler = async (event, callback, runner) => {
	let response;

	try {
		const result = await runner(event);

		response = {
			statusCode: 200,
			body: JSON.stringify({ success: true, ...result }),
		};
	} catch (error) {
		logger.error(error);
		/**
		 * Unexpected error occurred - log it and return 500 to client.
		 */
		if (!(error instanceof APIError)) {
			error = ERROR_500; // eslint-disable-line no-ex-assign
		}

		response = {
			statusCode: error.httpStatus,
			body: JSON.stringify({
				success: false,
				message: error.message,
				code: error.errorCode,
			}),
		};
	}

	return callback(null, response);
};

/**
 * Converts multipart/form-data request into object.
 *
 * @see https://github.com/myshenin/aws-lambda-multipart-parser which didn't work for mailgun requests.
 * @param headers
 * @param body
 *
 * @return {*}
 */
const parseMultipartFormData = ({ headers, body }) => {
	/* eslint-disable */
	try {
		const boundary = Object.keys(headers)
			.map(presentKey => (presentKey.toLowerCase() === 'content-type' ? headers[presentKey] : null))
			.filter(item => item)[0].split('=')[1];

		return body
			.split(boundary)
			.filter(item => item.match(/Content-Disposition/))
			.map((item) => {
				const result = {};

				result[
					item
						.match(/name="[a-zA-Z_]+([a-zA-Z0-9_-]*)"/)[0]
						.split('=')[1]
						.match(/[a-zA-Z_]+([a-zA-Z0-9_-]*)/)[0]
				] = item
					.split(/\r\n\r\n/)[1]
					.split(/\r\n--/)[0];
				return result;
			})
			.reduce((accumulator, current) => Object.assign(accumulator, current), {});
	} catch (e) {
		return null;
	}
	/* eslint-enable */
};

module.exports = {
	HTTPLambda: lambdaHandler,
	parseMultipartFormData,
};
