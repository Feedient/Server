'use strict';

var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var ObjectId        = Schema.ObjectId;
var ObjectIdMongo   = mongoose.Types.ObjectId;
var msgFormatter    = require('../lib/msgFormatter');

var UserSessionSchema = new Schema({
	userId: { type: ObjectId, required: true },
	token: { type: String, required: true, index: { unique: true } },
	platform: { type: String, required: false },
	browser: { type: String, required: false },
	ipAddress: { type: String, required: false },
	lastLogin: { type: Date, required: true }
});

/**
 * Validates the user token
 *
 * @param userToken
 * @return error
 * @return user
 */
UserSessionSchema.statics.validateUserToken = function(userToken, callback) {
	this.findOne({ token: userToken }, function(err, token) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		if (token) {
			token.lastLogin = new Date();
			token.save(function(err) {
				if (err) return callback('errors.DATABASE_SAVE_ERROR');

				// http://stackoverflow.com/questions/14307953/mongoose-typeerror-on-a-models-findone-method
				mongoose.model('User').findOne({ _id: token.userId }, function(err, user) {
					if (err) return callback('errors.DATABASE_SELECT_ERROR');
					callback(null, user);
				});
			});
		} else {
			callback('UNAUTHORIZED');
		}
	});
};

/**
 * Get the specified user's session tokens
 *
 * @param userId
 * @return error
 * @return tokens
 */
UserSessionSchema.statics.getTokensByUserId = function(userId, callback) {
	var objectId;

	try {
		objectId = mongoose.Types.ObjectId(userId.toString());
	} catch (e) {
		return callback(e.message);
	}

	this.find({ userId: objectId }, function(err, userSessions) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, userSessions);
	});
};

/**
 * Removes all the sessions with the given user token
 *
 * @param userToken
 * @return error
 */
UserSessionSchema.statics.removeByToken = function(userToken, callback) {
	this.findOne({ token: userToken.toString() }, function(err, userSession) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
        if (!userSession) return callback(null);

		userSession.remove(function(err) {
			if (err) return callback('errors.DATABASE_REMOVE_ERROR');
			return callback(null);
		});
	});
};

/**
 * Remove the sessions by userId
 *
 * @param userId
 * @return error
 */
UserSessionSchema.statics.removeByUserId = function(userId, callback) {
	this.remove({ userId: userId }, function(err) {
		if (err) return callback('errors.DATABASE_REMOVE_ERROR');
		return callback(null);
	});
};

module.exports = mongoose.model('UserSession', UserSessionSchema);
