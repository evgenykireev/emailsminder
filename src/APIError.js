function APIError({ httpStatus, errorCode, message }) {
	this.errorCode = errorCode;
	this.httpStatus = httpStatus;
	this.message = message;
}

APIError.prototype = new Error();

module.exports = {
	APIError,

	ERROR_500: new APIError({
		errorCode: 500,
		httpStatus: 500,
		message: 'Oops, unexpected error occurred. Please try again.',
	}),

	ERROR_404: new APIError({
		errorCode: 404,
		httpStatus: 404,
		message: 'Resource not found',
	}),

	ERROR_MISSING_INPUT: new APIError({
		errorCode: 1,
		httpStatus: 400,
		message: 'Missing input',
	}),

	ERROR_MALFORMED_INPUT: (message) => (
		new APIError({
			errorCode: 2,
			httpStatus: 400,
			message: `Malformed input: ${message}`,
		})
	),

	ERROR_MISSING_BODY: new APIError({
		errorCode: 5,
		httpStatus: 400,
		message: 'Missing Body',
	}),
};
