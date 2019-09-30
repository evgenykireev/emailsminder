const { stage } = require('../config');

/**
 * Handles error message.
 *
 * @param message
 */
const error = (message) => {
	if (stage === 'dev' || stage === 'test') {
		console.log(message);
	} else {
		// @todo log error
	}
};

module.exports = {
	error,
};
