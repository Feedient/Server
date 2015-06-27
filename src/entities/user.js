'use strict';

var mongodb             = require('mongodb');
var tokenGenerator      = require('../lib/tokenGenerator');
var mongoose            = require('mongoose');
var Schema              = mongoose.Schema;
var bcrypt              = require('bcrypt');
var UserSession         = require('./userSession');
var UserProvider        = require('./userProvider');
var SALT_WORK_FACTOR    = 10;
var MAX_LOGIN_ATTEMPTS  = 5;
var LOCK_TIME           = 5 * 60 * 1000; // 2 hours
var platform            = require('platform');
var fs              	= require('fs');

// User schema
var UserSchema = new Schema({
	email: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	role: { type: String, required: true },
	dateCreated: { type: Date, default: Date.now },
	loginAttempts: { type: Number, required: true, default: 0 },
	language: { type: String, required: true, default: 'en_GB' },
	lockUntil: { type: Date },
	recoverKey: { type: String, default: '' },
	recoverCount: { type: Number, default: 0 },
	emailConfirmToken: { type: String, default: '' },
	emailConfirmEmail: { type: String, default: '' },
	isDeleted: { type: Boolean, default: false },
	deleteDate: { type: Date },
	last_refresh_time: { type: Date, default: Date.now, required: false },
	lastLogin: { type: Date, default: Date.now },
	plan_expire_time: { type: Date }
});


// Check for a future lockUntil timestamp
UserSchema.virtual('isLocked').get(function () {
	return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Before we save the user execute this
UserSchema.pre('save', function(next) {
	var user = this;

	// Only hash the password if it has been modified or is new
	if (!user.isModified('password')) {
        return next();
    }

	// Generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
		if (err) return next('BCRYPT_GEN_SALT_ERROR');

		// Hash the password along with our new salt
		bcrypt.hash(user.password, salt, function (err, hash) {
			if (err) return next('BCRYPT_HASH_ERROR');

			// Override the cleartext password with the hashed one
			user.password = hash;
			return next();
		});
	});
});

/**
 * Compare the given password with the password in the database
 */
UserSchema.methods.comparePassword = function(candidatePassword, callback) {
	bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
		if (err) return callback('errors.BCRYPT_COMPARE_ERROR');
		return callback(null, isMatch);
	});
};

/**
 * Assign a token to the user where he/she can login with
 */
UserSchema.methods.assignUserToken = function (userAgent, xForwardedFor, callback) {
	var user = this;
	var userInfo = platform.parse(userAgent);

	// On each login we generate a user token!
	tokenGenerator(user._id, function (token) {
		var newUserSession = new UserSession({
			userId: user._id,
			token: token,
			platform: userInfo.os.family,
			browser: userInfo.name,
			ipAddress: xForwardedFor,
			lastLogin: new Date()
		});

		return newUserSession.save(function (err) {
			if (err) return callback('errors.DATABASE_SAVE_ERROR');
			return callback(null, newUserSession);
		});
	});
};

/**
 * Increment the number of times somebody tried to login by 1
 */
UserSchema.methods.incLoginAttempts = function(callback) {
	// If we have a previous lock that has expired, restart at 1
	if (this.lockUntil && this.lockUntil < Date.now()) {
		return this.update({
			$set: { loginAttempts: 1 },
			$unset: { lockUntil: 1 }
		}, callback);
	}

	// Otherwise we're incrementing
	var updates = { $inc: { loginAttempts: 1 } };

	// Lock the account if we've reached max attempts and it's not locked already
	if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
		updates.$set = { lockUntil: Date.now() + LOCK_TIME };
	}

	return this.update(updates, callback);
};

/**
 * Check if the user has a provider with the given id
 */
UserSchema.methods.hasUserProvider = function(userProviderId, callback) {
	var objectId;

	try {
		objectId = mongoose.Types.ObjectId(userProviderId.toString());
	} catch (e) {
		return callback(e.message);
	}

	var user = this;

	UserProvider.findOne({ _id: objectId, userId: user._id }, function(err, userProvider) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');

        // If we can not find it just return the error
        if (!userProvider) return callback('errors.PROVIDER_NOT_FOUND');

        // If we found it return it
		return callback(null, userProvider);
	});
};

/**
 * Get the providers for this  account
 */
UserSchema.methods.getUserProviders = function(callback) {
	UserProvider.getProvidersByUserId(this._id, function(err, userProviders) {
		if (err) return callback(err);
		return callback(null, userProviders);
	});
};

/**
 * Remove the userProvider with the specified Id
 */
UserSchema.methods.removeUserProvider = function(userProviderId, callback) {
	UserProvider.findOne({ _id: userProviderId }, function(err, userProvider) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		if (!userProvider) return callback('errors.DATABASE_NO_RECORDS_FOUND');

		return userProvider.remove(function (err) {
			if (err) return callback('errors.DATABASE_REMOVE_ERROR');
			callback(null);
		});
	});
};

UserSchema.methods.removeAccount = function(callback) {
	var updates = { $set: { isDeleted: true, deleteDate: new Date() } };
	return this.update(updates, callback);
};

UserSchema.methods.setEmailConfirmEmail = function(newEmail, callback) {
	var updates = { $set: { emailConfirmEmail: newEmail } };
	return this.update(updates, callback);
};

UserSchema.methods.setEmail = function(newEmail, callback) {
	var updates = { $set: { email: newEmail } };
	return this.update(updates, callback);
};

UserSchema.methods.setEmailConfirmToken = function(newToken, callback) {
	var updates = { $set: { emailConfirmToken: newToken } };
	return this.update(updates, callback);
};

UserSchema.methods.updateLastLogin = function(callback) {
	var updates = { $set: { lastLogin: new Date() } };
	return this.update(updates, callback);
};

/**
 * Update the password of the user, needs oldPassword, newPassword, newPasswordConfirm
 * @return: callback(error, uid, newToken);
 */
UserSchema.methods.updatePassword = function(oldPassword, newPassword, newPasswordConfirm, userAgent, xForwardedFor, callback) {
	var user = this;

	// Check if the entered password matches our current password
	user.comparePassword(oldPassword, function(err, result) {
		if (err || !result) {
			return callback('errors.ACCOUNT_PASSWORD_INCORRECT');
		}

		// If the passwords do not match
		if (newPassword != newPasswordConfirm) {
			return callback('errors.ACCOUNT_PASSWORD_CONFIRM_WRONG');
		}

		// Set the new password, it gets hashed upon save
		user.password = newPassword;

		user.save(function(err) {
			if (err) return callback(err);

			// Delete all the tokens, password changed!
			UserSession.removeByUserId(user._id, function(err) {
				if (err) return callback(err);

				User.authenticateManually(user._id, userAgent, xForwardedFor, function(err, user, userToken) {
					if (err) return callback(err);

					// Login successfull if we have a user
					if (userToken && user) {
						return callback(null, user._id, userToken.token);
					}
				});
			});
		});
	});
};

/**
 * Update the user's language
 *
 * returns callback(error, success);
 */
UserSchema.methods.updateLanguage = function(newLanguage, callback) {
	var user = this;

	// Check if the language exists
	fs.exists('./src/locales/' + newLanguage, function(exists) {
		if (!exists) return callback('errors.ACCOUNT_UPDATE_LANGUAGE_NOT_FOUND');

		// Set the language
		user.language = newLanguage;

		// Save
		user.save(function(err) {
			if (err) return callback('errors.DATABASE_SAVE_ERROR');
			return callback(null, true);
		});
	});
};

UserSchema.methods.setRole = function(newRole, expireTime, callback) {
	var updates = { $set: { role: newRole, plan_expire_time: expireTime } };
	return this.update(updates, callback);
};

/**
 * Try to authenticate the user with the given credentials, returns user and userToken on success
 * @param  {string} email
 * @param  {string} password
 * @return {string} err
 * @return {string} user
 * @return {string} userToken
 */
UserSchema.statics.getAuthenticated = function(email, password, userAgent, xForwardedFor, callback) {
	this.findOne({ email: email }, function(err, user) {
		if (err) {
			return callback(err);
		}

		// Make sure the user exists
		if (!user) {
			return callback('errors.ACCOUNT_NOT_FOUND');
		}

		// Check if the user is deleted
		if (user.isDeleted) {
			return callback('errors.ACCOUNT_NOT_FOUND');
		}

		// check if the account is currently locked
		if (user.isLocked) {
			// Just increment login atttempts if account is already locked
			return user.incLoginAttempts(function(err) {
				if (err) return callback('errors.DATABASE_UPDATE_ERROR');
				return callback('errors.ACCOUNT_MAX_ATTEMPTS_EXCEEDED');
			});
		}

		// Test for matching password
		user.comparePassword(password, function(err, isMatch) {
			if (err) return callback(err);

			// check if the password was a match
			if (isMatch) {
				// Assign a user token
				return user.assignUserToken(userAgent, xForwardedFor, function(err, userToken) {
					if (err) return callback(err);

					// If there's no lock or failed attempts, just return the user
					if (!user.loginAttempts && !user.lockUntil) return callback(null, user, userToken);

					// Reset atempts and lock info
					var updates = {
						$set: { loginAttempts: 0 },
						$unset: { lockUntil: 1 }
					};

					return user.update(updates, function(err) {
						if (err) return callback('errors.DATABASE_UPDATE_ERROR');
						return callback(null, user, userToken);
					});
				});
			}

			// Password is incorrect, so increment login attempts before responding
			user.incLoginAttempts(function(err) {
				if (err) return callback('errors.DATABASE_UPDATE_ERROR');
				return callback('errors.ACCOUNT_PASSWORD_INCORRECT');
			});
		});
	});
};

/**
 * Manually force authentication of any user from user ID
 * @param  {string} userId
 * @param  {object} headers
 * @param  {function} callback
 * @return {string} err
 * @return {string} user
 * @return {string} userToken
 */
UserSchema.statics.authenticateManually = function(userId, userAgent, xForwardedFor, callback) {
	this.findOne({ _id: userId }, function(err, user) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');

		// Make sure the user exists
		if (!user) return callback('errors.ACCOUNT_NOT_FOUND');

		// Check if the user is deleted
		if (user.isDeleted) {
			return callback('errors.ACCOUNT_NOT_FOUND');
		}

		// check if the account is currently locked
		if (user.isLocked) {
			// Just increment login atttempts if account is already locked
			return user.incLoginAttempts(function(err) {
				if (err) return callback('errors.DATABASE_UPDATE_ERROR');
				return callback('errors.ACCOUNT_MAX_ATTEMPTS_EXCEEDED');
			});
		}

		// Assign a user token
		return user.assignUserToken(userAgent, xForwardedFor, function(err, userToken) {
			if (err) return callback(err);

			// If there's no lock or failed attempts, just return the user
			if (!user.loginAttempts && !user.lockUntil) return callback(null, user, userToken);

			// Reset atempts and lock info
			var updates = {
				$set: { loginAttempts: 0 },
				$unset: { lockUntil: 1 }
			};

			return user.update(updates, function(err) {
				if (err) return callback('errors.DATABASE_UPDATE_ERROR');
				return callback(null, user, userToken);
			});
		});
	});
};

UserSchema.statics.findByEmail = function(email, callback) {
	this.findOne({ email: email }, function(err, user) {
		if (err) return callback(err);
		if (!user) return callback(null, null);

		// Check if the user is deleted
		if (user.isDeleted) {
			return callback(null, null);
		}

		return callback(null, user);
	});
};

var User = mongoose.model('User', UserSchema);
module.exports = User;
