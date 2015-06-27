var stringGenerator  = require('../lib/stringGenerator');
var async		   	 = require('async');
var sha1			 = require('sha1');
var accountService	 = require('../services/account');
var workspaceService = require('../services/workspace');
var panelService	 = require('../services/panel');
var providerService	 = require('../services/provider');
var config           = require('../../config/app');

/**
 * Logs out the user, destroys the cookie for the current platform only
 */
exports.logout = function(request, reply) {
	accountService.logout(request.headers.bearer, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};

exports.refreshProviders = function(request, reply) {
	accountService.refreshProviders(request.auth.credentials, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};

exports.removeAccount = function(request, reply) {
	accountService.removeAccount(request.auth.credentials, request.payload.password, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};

/**
 * Logs in the user
 */
exports.authorizeAccount = function(request, reply) {
	var userAgent = request.headers['user-agent'];
	var xForwardedFor = request.headers['x-forwarded-for'];

	accountService.authorize(request.payload.email, request.payload.password, userAgent, xForwardedFor, function(err, userId, userToken) {
		if (err) return reply({ error: err });
		return reply({ uid: userId, token: userToken });
	});
};

/**
 * Gets the sessions of a user
 */
exports.getSessions = function(request, reply) {
	accountService.getSessions(request.auth.credentials, function(err, sessions) {
		if (err) return reply({ error: err });
		return reply({ sessions: sessions });
	});
};

/**
 * Removes the specified session
 */
exports.removeSession = function (request, reply) {
	var user = request.auth.credentials;

	accountService.removeSession(user, request.params.token, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};

/**
 * Validate and store the user information in the database
 * @param {string} email
 * @param {string} password
 * @return {array} { success, error }
 */
exports.createAccount = function(request, reply) {
	accountService.create(request.payload.email, request.payload.password, function(err, newUser) {
		if (err) return reply({ error: err });

		var json = {
			_id: newUser._id.toString(),
			email: newUser.email,
			language: newUser.language,
			role: newUser.role,
			workspaces: []
		};

		workspaceService.getWorkspacesByUser(newUser, function(err, workspaces) {
			if (err) return reply({ error: err });

			async.each(workspaces, function(workspace, callback) {
				var jsonWorkspace = {
					name: workspace.name,
					creator: workspace.creator.toString(),
					id: workspace._id.toString(),
					date_added: workspace.date_added,
					users: workspace.users,
					isOwner: (workspace.creator == newUser._id) ? true : false
				};

				json.workspaces.push(jsonWorkspace);

				return callback();
			}, function(err) {
				if (err) return reply({ error: err });
				return reply(json);
			});
		});
	});
};

exports.generateInvitationKey = function(request, reply) {
	accountService.createInvitationKey(request.params.key, function(err, key) {
		if (err) return reply({ error: err });
		return reply({ key: key });
	});
};

exports.getAccount = function(request, reply) {
	var json = {};

	async.parallel({
		// If the user is a USER_AD_FREE, then check the expire time
		// Note: We check this first (or atleast try too? xD)
		check_ad_expire_time: function(callback) {
			var today = new Date().getTime();

			if (request.auth.credentials.role == 'USER_AD_FREE' && request.auth.credentials.plan_expire_time) {
				if (today > request.auth.credentials.plan_expire_time.getTime()) {
					// Expired plan! Downgrade user
					request.auth.credentials.setRole('USER', null, function(err, success) {
						if (err) return callback(err);
						return callback(null);
					});
				} else {
					return callback(null);
				}
			} else {
				return callback(null);
			}
		},

		get_account_details: function(callback) {
			accountService.get(request.auth.credentials, function(err, account) {
				if (err) return callback(err);

				json._id = account._id.toString();
				json.email = account.email;
				json.language = account.language;
				json.role = account.role;
				json.last_login = account.last_login;

				return callback(null);
			});
		},

		get_user_providers: function(callback) {
			providerService.getProviders(request.auth.credentials, function(err, userProviders) {
				if (err) return callback(err);

				json.user_providers = userProviders;

				return callback(null);
			});
		},

		get_panels_and_workspaces: function(callback) {
			panelService.getPanelsAndWorkspaces(request.auth.credentials, function(err, workspacesAndPanels) {
				if (err) return callback(err);

				json.workspaces = workspacesAndPanels;

				return callback(null);
			});
		},

		check_refresh_providers: function(callback) {
			var today = new Date().getTime();

			// If we do not need to refresh then return
			if (request.auth.credentials.last_refresh_time &&
				today < request.auth.credentials.last_refresh_time.getTime() + parseInt(config.user.refresh_time_days) * 24 * 3600 * 1000) {
				return callback(null);
			}

			// Else refresh the account, this will set a last_refresh_time
			accountService.refreshProviders(request.auth.credentials, function(err, success) {
				if (err) return callback(err);
				return callback(null);
			});
		},

		update_last_login: function(callback) {
			accountService.updateLastLogin(request.auth.credentials, function(err, success) {
				if (err) return callback(err);
				return callback(null);
			});
		}
	}, function(err) {
		if (err) return reply({ error: err });
		return reply(json);
	});
};

exports.updateAccount = function(request, reply) {
	var updates = {};

	// If passwords set, update password
	if (request.payload.oldPassword && request.payload.password) {
		updates.updatePassword = function(callback) {
			var oldPassword = request.payload.oldPassword;
			var newPassword = request.payload.password;
			var newPasswordConfirm = newPassword;

			accountService.updatePassword(request.auth.credentials, oldPassword, newPassword, newPasswordConfirm, request.headers['user-agent'], request.headers['x-forwarded-for'], function(err, uid, newToken) {
				if (err) return callback(err);
				return callback(null, { success: true, token: newToken, uid: uid });
			});
		};
	}

	// If language set, update language
	if (request.payload.language) {
		updates.updateLanguage = function(callback) {
			var newLanguage = request.payload.language;

			accountService.updateLanguage(request.auth.credentials, newLanguage, function(err, success) {
				if (err) return callback(err);
				return callback(null, { success: success });
			});
		};
	}

	// If email set, send confirmation email
	if (request.payload.email) {
		updates.setEmail = function(callback) {
			var oldEmail = request.auth.credentials.email;
			var newEmail = request.payload.email;
			var confirmToken = sha1(stringGenerator(20));

			accountService.updateEmail(request.auth.credentials, oldEmail, newEmail, confirmToken, function(err, success) {
				if (err) return callback(err);
				return callback(null, { success: success });
			});
		};
	}

	// Process the updates
	async.parallel(updates, function(err, results) {
		if (err) return reply({ error: err });
		return reply(results);
	});
};

exports.updateEmailConfirm = function(request, reply) {
	var confirmCode = request.params.code;

	accountService.updateEmailConfirm(request.auth.credentials, confirmCode, function(err, success) {
		if (err) return reply({ error: err });
		return reply({ success: success });
	});
};
