var Mail = require('../services/mail');

/**
 * Logs out the user, destroys the cookie for the current platform only
 */
exports.sendContactEmail = function(request, reply) {
	// Get payload
	var name = request.payload.name;
	var email = request.payload.email;
	var cause = request.payload.cause;
	var message = request.payload.message;

	// Send the email
	Mail.sendContactEmail(name, email, cause, message, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};

exports.recoverPasswordConfirmEmail = function(request, reply) {
	var email = request.payload.email;

	// Send the email
	Mail.recoverPasswordConfirmEmail(email, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};

exports.recoverPasswordVerifyResetToken = function(request, reply) {
	var email = request.query.email;
	var key = request.params.key;

	// Send the email
	Mail.recoverPasswordVerifyResetToken(email, key, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};
