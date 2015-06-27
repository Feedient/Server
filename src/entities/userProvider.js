'use strict';

var mongoose        = require('mongoose')
var Schema          = mongoose.Schema;
var ObjectId        = Schema.ObjectId;
var ObjectIdMongo   = mongoose.Types.ObjectId;
var config          = require('../../config/app');
var async           = require('async');

var UserProviderSchema = new Schema({
	userId: { type: ObjectId, required: true },
	providerName: { type: String, required: true },
	providerUserId: { type: String, required: true },
	providerAccount: { type: Object, required: true },
	providerTokens: { type: Object, required: true },
	order: { type: Number, default: 1, required: true },
	dateAdded: { type: Date, default: Date.now },
	lastRequest: { type: Date }
});

/**
 * Get the elements count
 */
UserProviderSchema.statics.getProviderCount = function(userId, callback) {
	this.count({ userId: userId }, function(err, count) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, count);
	});
};

/**
 * Get the elements count by the provider name
 */
UserProviderSchema.statics.getProviderCountByName = function(userId, providerName, callback) {
	this.count({ userId: userId, providerName: providerName }, function(err, count) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, count);
	});
};

UserProviderSchema.statics.getProviderById = function(id, callback) {
	var objectId;

	try {
		objectId = mongoose.Types.ObjectId(id.toString());
	} catch (e) {
		return callback(e.message);
	}

	this.findOne({ _id: objectId }, function(err, userProvider) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, userProvider);
	});
};

/**
 * Get the user providers by the userid, ASCENDING = 1
 */
UserProviderSchema.statics.getProvidersByUserId = function(userId, callback) {
	this.find({ userId: mongoose.Types.ObjectId(userId) }).sort({ order: 1 }).exec(function(err, userProviders) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, userProviders);
	});
};

UserProviderSchema.statics.getUserProviderById = function(id, callback) {
	var objectId;

	try {
		objectId = mongoose.Types.ObjectId(id.toString());
	} catch (e) {
		return callback(e.message);
	}

	this.findOne({ _id: objectId }, function(err, userProvider) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, userProvider);
	});
};

UserProviderSchema.statics.updateOrder = function(userProviderId, order, callback) {
	this.findOne({ _id: mongoose.Types.ObjectId(userProviderId) }, function(err, userProvider) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');

		var updates = { $set: { order: order } };
		return userProvider.update(updates, callback);
	});
};

/**
 * Creates a new UserProvider account
 * 1) If we have the account already, then update the accessToken
 * 2) Else, create a new UserProvider account
 *
 * @param userId
 * @param providerName
 * @param callback
 * @param providerAccountUserId
 * @param providerAccountTokens
 * @param providerAccountDetails
 */
UserProviderSchema.statics.createProviderAccount = function(userId, providerName, providerAccountUserId, providerAccountDetails, providerAccountTokens, callback) {
	if (!providerAccountUserId || !providerAccountTokens || !providerAccountDetails) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    // Check if we got the account already
    self.findUserProvider(userId, providerName, providerAccountUserId, function(err, userProvider) {
        if (err) return callback(err);

        // If we got a UserProvider, then save the new accessToken
        if (userProvider) {
            return userProvider.updateTokens(providerAccountTokens, function(err) {
                if (err) return callback(err);
                return callback(null, userProvider);
            });
        }

        // Else create a new UserProvider account
        var newProvider = new UserProvider({
            userId: userId,
            providerName: providerName,
            providerUserId: providerAccountUserId,
            providerAccount: providerAccountDetails,
            providerTokens: providerAccountTokens
        });

        // Add the provider account as last userprovider
        return self.getProviderCount(userId, function(err, count) {
            if (err) return callback(err);

            newProvider.order = count;

            // Save
            return newProvider.save(function(err) {
                if (err) return callback(err);
                return callback(null, newProvider);
            });
        });
    });
};

/**
 * Get a userProvider by the unique keys
 */
UserProviderSchema.statics.findUserProvider = function(userId, providerName, providerUserId, callback) {
	this.findOne({ userId: userId, providerName: providerName, providerUserId: providerUserId }, function(err, userProvider) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		return callback(null, userProvider);
	});
};

/**
 * Change the last request date
 */
UserProviderSchema.methods.setLastRequest = function(lastRequestDate, callback) {
	var updates = { $set: { lastRequest: lastRequestDate } };
	return this.update(updates, callback);
};

UserProviderSchema.methods.setOrder = function(order, callback) {
	var updates = { $set: { order: order } };
	return this.update(updates, callback);
};

UserProviderSchema.methods.updateTokens = function(tokens, callback) {
	var updates = { $set: { providerTokens: tokens } };
	return this.update(updates, callback);
};

/**
 * Updates:
 * - avatar
 * - username
 * - userFullName
 */
UserProviderSchema.methods.updateProviderAccount = function(providerAccount, callback) {
	var newAccount = { providerAccount: {} };

	if (providerAccount.avatar) newAccount.providerAccount.avatar = providerAccount.avatar;
	if (providerAccount.username) newAccount.providerAccount.username = providerAccount.username;
	if (providerAccount.userFullName) newAccount.providerAccount.userFullName = providerAccount.userFullName;

	var updates = { $set: newAccount };

	return this.update(updates, callback);
};

var UserProvider = mongoose.model('UserProvider', UserProviderSchema);
module.exports = UserProvider;
