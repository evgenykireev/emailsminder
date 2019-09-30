const Ajv = require('ajv');
const querystring = require('querystring');
const { parseMultipartFormData } = require('../helpers/lambda');

const apiSchema = require('../../openapi.json');

const schemaName = 'openapi.json';

const ajv = new Ajv({
	coerceTypes: true,
}).addSchema(apiSchema, schemaName);

const {
	ERROR_500,
	ERROR_MISSING_INPUT,
	ERROR_MALFORMED_INPUT,
} = require('../APIError');

/**
 * Validates request body based on openapi schema definitions.
 *
 * @todo hardcoding a lot for now. Should be more flexible in future.
 *
 * @param operationId
 * @param body
 * @returns {object}
 */
const validateRequestBody = (operationId, { body }) => {
	if (!body || String !== body.constructor) {
		throw ERROR_MISSING_INPUT;
	}

	let input = {};
	try {
		input = JSON.parse(body);
	} catch (error) {
		throw ERROR_MALFORMED_INPUT;
	}

	let operation;
	const paths = Object.keys(apiSchema.paths);
	for (let i = 0; i < paths.length; i += 1) {
		operation = Object.values(apiSchema.paths[paths[i]]).find((method) => method.operationId === operationId);
		if (operation) {
			break;
		}
	}

	if (!operation) {
		throw ERROR_500;
	}

	const schema = { ...operation.requestBody.content['application/json'].schema };
	if (schema.$ref) {
		schema.$ref = `${schemaName}${schema.$ref}`;
	}

	const valid = ajv.validate(schema, input);
	if (!valid) {
		throw ERROR_MALFORMED_INPUT(ajv.errorsText(valid.errors));
	}

	return input;
};

/**
 * Validates params for getting email.
 *
 * @param input
 * @returns {{emailID: String}}
 */
const validatePathParams = (input, keys) => {
	if (!input) {
		throw ERROR_MISSING_INPUT;
	}

	if (Object !== input.constructor || !Object.keys(input).length) {
		throw ERROR_MALFORMED_INPUT;
	}

	const result = {};
	keys.forEach((key) => {
		const val = input[key];
		if (!val || String !== val.constructor) {
			throw ERROR_MALFORMED_INPUT(`${key} is missing`);
		}

		result[key] = val;
	});

	return result;
};

/**
 * Validates params for processing email.
 *
 * @param input
 * @returns {{emailID: String}}
 */
const validateProcessEmailParams = (input) => {
	if (!input) {
		throw ERROR_MISSING_INPUT;
	}

	if (Object !== input.constructor || input.EventSource !== 'aws:sns' || !input.hasOwnProperty('Sns') || Object !== input.Sns.constructor) {
		throw ERROR_MALFORMED_INPUT;
	}

	const { Message } = input.Sns;

	if (String !== Message.constructor) {
		throw ERROR_MALFORMED_INPUT;
	}

	let parsedInput;
	try {
		parsedInput = JSON.parse(Message);
	} catch (error) {
		throw ERROR_MALFORMED_INPUT;
	}

	if (Object !== parsedInput.constructor || !Object.keys(parsedInput).length) {
		throw ERROR_MALFORMED_INPUT;
	}

	const { emailID } = parsedInput;

	return {
		emailID,
	};
};

/**
 * Validates webhook request.
 *
 * Webhook might send data in many different formats and encodings, so to handle all them here
 * - first check if it's json data
 * - then check multipart/form-data
 * - finally use application/x-www-form-urlencoded
 *
 * @param event
 * @return {{provider: *, data: {}}}
 */
const validateWebhookBody = (event) => {
	const { body, pathParameters, headers } = event;
	if (!pathParameters || Object !== pathParameters.constructor || !headers || Object !== headers.constructor) {
		throw ERROR_MISSING_INPUT;
	}

	const { provider } = pathParameters;
	if (!provider || String !== provider.constructor) {
		throw ERROR_MALFORMED_INPUT;
	}

	if (!body || String !== body.constructor) {
		throw ERROR_MISSING_INPUT;
	}

	let data = {};
	const contentType = headers['Content-type'] || headers['Content-Type'] || headers['content-type'];
	if (contentType && contentType.indexOf('application/json') !== -1) {
		data = JSON.parse(body);
	} else {
		data = parseMultipartFormData(event);
		if (!data || !Object.keys(data).length) {
			data = querystring.parse(body);
		}
	}

	return {
		provider,
		data,
	};
};

module.exports = {
	validatePathParams,
	validateRequestBody,
	validateProcessEmailParams,
	validateWebhookBody,
};
