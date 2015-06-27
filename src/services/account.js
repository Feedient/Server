var fs              = require('fs');
var User            = require('../entities/user');
var UserSession     = require('../entities/userSession');
var RegisterKey     = require('../entities/registerKey');
var msgFormatter    = require('../lib/msgFormatter');
var stringGenerator = require('../lib/stringGenerator');
var config          = require('../../config/app');
var async		   	= require('async');
var nodemailer	  	= require('nodemailer');
var sha1			= require('sha1');
var workspaceService = require('./workspace');
var providerService = require('./provider');

exports.logout = function(accessToken, callback) {
	var headerToken = accessToken;

	UserSession.removeByToken(headerToken, function(err) {
		if (err) return callback(err);
		return callback(null, true);
	});
};

exports.refreshProviders = function(userEntity, callback) {
	userEntity.getUserProviders(function(err, providers) {
		if (err) return callback(err);

		async.each(providers, function(provider, callback) {
			providerService.refreshProvider(provider._id, function(err, isSuccess) {
				if (err) return callback(err);

				// Save account new refresh time
				userEntity.last_refresh_time = new Date();
				userEntity.save(function(err) {
					if (err) return callback(err);
					return callback(null);
				});
			});
		}, function(err) {
			if (err) return callback(err);
			return callback(null, true);
		});
	});
};

exports.removeAccount = function(userEntity, password, callback) {
    async.series([
        // Check if passwords matches
        function(callback) {
            userEntity.comparePassword(password, function(err, isMatch) {
                if (err) return callback(err);
                if (!isMatch) return callback('errors.ACCOUNT_PASSWORD_CONFIRM_WRONG');

                return callback(null);
            });
        },
        // Remove the account
        function(callback) {
            userEntity.removeAccount(function(err) {
                if (err) return callback('errors.ACCOUNT_REMOVE_ERROR');
                return callback(null);
            });
        },
        // Remove user sessions
        function(callback) {
            UserSession.removeByUserId(userEntity._id, function(err) {
                if (err) return callback(err);
                return callback(null);
            });
        }
    ],
    // Return the result or error
    function(err) {
        if (err) return callback(err);
        return callback(null, true);
    });
};

exports.authorize = function(email, password, userAgent, xForwardedFor, callback) {
    User.getAuthenticated(email, password, userAgent, xForwardedFor, function(err, user, userToken) {
        if (err) return callback(err);

        // Login successfull if we have a user
        if (userToken && user) {
            return callback(null, user._id, userToken.token);
        }

        // We should not reach this
        return callback('errors.UNAUTHORIZED_UNKNOWN');
    });
};

exports.getSessions = function(userEntity, callback) {
    if (!userEntity._id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    UserSession.getTokensByUserId(userEntity._id, function(err, userSessions) {
        if(err) return(err);
        return callback(null, userSessions);
    });
};

/**
 * Remove a session from the logged in user.
 * @param {object}   userEntity
 * @param {string}   accessToken
 * @param {Function} callback
 */
exports.removeSession = function(userEntity, accessToken, callback) {
	UserSession.findOne({ userId: userEntity._id, token: accessToken }, function(err, foundToken) {
		if (err) return callback(err);
		if (!foundToken) return callback(null, false);

		UserSession.removeByToken(accessToken, function (err) {
			if(err) return callback(err);
			return callback(null, true);
		});
	});
};

/**
 * Creates a User
 * @param  {string}   email
 * @param  {string}   password
 * @param  {Function} callback
 * @return {err, userObject}
 */
exports.create = function(email, password, callback) {
    async.waterfall([
        // Check if the email is registered already
        function(callback) {
            User.findByEmail(email, function(err, user) {
                if (err) return callback(err);
                if (user) return callback('errors.ACCOUNT_EMAIL_EXISTS');
                return callback(null);
            });
        },
        // Create the user
        function(callback) {
            // Create a new user
            var newUser = new User({
                email: email,
                password: password,
                role: config.user.default_role
            });

            // Save the user, pass gets hashed on save trigger
            newUser.save(function(err) {
                if (err) return callback(err);
                return callback(null, newUser);
            });
        },
		// Create the default workspace
		function(newUser, callback) {
			workspaceService.create(newUser, config.user.default_workspace_name, function(err, workspace) {
				if (err) return callback(err);
				return callback(null, newUser);
			});
		}
    ],
    // Return the result or error
    function(err, newUser) {
        if (err) return callback(err);
        return callback(null, newUser);
    });
};

exports.createInvitationKey = function(key, usages, callback) {
	if (typeof usages === 'function') {
		callback = usages;
		usages = 1;
	}

	if (!usages) { usages = 1; }

    var keyObject = new RegisterKey({
        key: key,
		usages: usages
    });

    keyObject.save(function(err) {
        if (err) return callback('errors.DATABASE_SAVE_ERROR');
        return callback(null, keyObject);
    });
};

exports.get = function(userEntity, callback) {
	workspaceService.getWorkspacesByUser(userEntity, function(err, workspaces) {
		if (err) return callback(err);

		// check if has default workspace
		var json = {
			_id: userEntity._id,
			email: userEntity.email,
			language: userEntity.language,
			role: userEntity.role,
			last_login: userEntity.lastLogin
		};

		if (!workspaces || !workspaces.length) {
			workspaceService.create(userEntity, config.user.default_workspace_name, function(err, workspace) {
				if (err) return callback(err);
				return callback(null, json);
			});
		} else {
			return callback(null, json);
		}
	});
};

exports.updatePassword = function(userEntity, oldPassword, newPassword, newPasswordConfirm, userAgent, xForwardedFor, callback) {
    userEntity.updatePassword(oldPassword, newPassword, newPasswordConfirm, userAgent, xForwardedFor, function(err, uid, newToken) {
        if (err) return callback(err);
        return callback(null, uid, newToken);
    });
};

exports.updateLastLogin = function(userEntity, callback) {
	return userEntity.updateLastLogin(callback);
};

exports.updateLanguage = function(userEntity, newLanguage, callback) {
    userEntity.updateLanguage(newLanguage, function(err, success) {
        if (err) return callback(err);
        return callback(null, success);
    });
};

exports.updateEmail = function(userEntity, oldEmail, newEmail, confirmToken, callback) {
    if (newEmail == userEntity.email) {
        return callback('errors.ACCOUNT_EMAIL_SAME_AS_OLD_ONE');
    }

    async.series([
        // Set a new email confirmation token
        function(callback) {
            userEntity.setEmailConfirmToken(confirmToken, function(err) {
                if (err) return callback(err);
                return callback(null);
            });
        },
        // Set the confirmation email
        function(callback) {
            userEntity.setEmailConfirmEmail(newEmail, function(err) {
                if (err) return callback(err);
                return callback(null);
            });
        },
        // Send the confirmation email
        function(callback) {
            _sendConfirmEmail(confirmToken, oldEmail, newEmail, function(response) {
                return callback(null);
            });
        }
    ],
    function(err) {
        if (err) return callback(err);
        return callback(null, true);
    });
};

exports.updateEmailConfirm = function(userEntity, code, callback) {
    if (userEntity.emailConfirmToken == confirmCode) {
        if (userEntity.emailConfirmEmail.trim() === "") {
            return callback('errors.ACCOUNT_EMAIL_CODE_INVALID');
        }

        async.series([
            // Set new Email in db
            function(callback) {
                userEntity.setEmail(userEntity.emailConfirmEmail, function(err, result) {
                    if (err) return callback(err);
                    return callback(null);
                });
            },
            // Set confirm code on ""
            function(callback) {
                userEntity.setEmailConfirmToken("", function(err, result) {
                    if (err) return callback(err);
                    return callback(null);
                });
            }
        ],
        function(err) {
            if (err) return callback(err);
            return callback(null, true);
        });
    } else {
        return callback('errors.ACCOUNT_EMAIL_CODE_INVALID');
    }
};

var _sendConfirmEmail = function(confirmToken, email, newEmail, callback) {
    // Create transport
    var transport = nodemailer.createTransport("SMTP", config.smtp);

    fs.readFile('src/views/emails/email_confirm.html', 'utf-8', function(err, html) {
        var subject = "Change your Feedient Email";
        var link = config.client.url + "confirm_email?code=" + confirmToken;

        // Super basic view renderer...
        html = html.replace(/\{\{title\}\}/g, subject);
        html = html.replace(/\{\{link\}\}/g, link);
        html = html.replace(/\{\{newEmail\}\}/g, newEmail);

        var mailOptions = {
            from: "Feedient <no-reply@feedient.com>", // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: 'You have requested to change your Feedient.com email to ' + newEmail + ', please visit this link to proceed: ' + link, // plaintext body
            html: html // html body
        };

        // Send mail
        transport.sendMail(mailOptions, function(err, response) {
            if (err) return callback(err);

            // Cleanup
            transport.close();

            // Return success
            return callback(null);
        });
    });
};
