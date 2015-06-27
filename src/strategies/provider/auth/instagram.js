var util = require('util');
var OAuth2Strategy = require('./OAuth2Strategy');
var urlFormatter = require('../../../lib/urlFormatter');
var msgFormatter = require('../../../lib/msgFormatter');
var Wreck = require('wreck');
/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(options) {
    options = options || {};
    options.clientID = options.clientID || "";
    options.clientSecret = options.clientSecret || "";
    options.callbackURL = options.callbackURL || "";
    options.accessTokenURL = options.accessTokenURL || 'https://api.instagram.com/oauth/access_token';
    options.apiURL = options.apiURL || 'https://api.instagram.com/v1';
    options.profileURL = options.profileURL || 'https://api.instagram.com/v1/users/self';

    OAuth2Strategy.call(this, options);

    this.name = 'instagram';
    this._apiURL = options.apiURL;
    this._profileURL = options.profileURL || options.apiURL + '/users/self';
};

/**
 * Inherit from `OAuth2Strategy`
 */
util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.getProfile = function(tokens, callback) {
    var self = this;
    var params = {
        access_token : tokens.access_token
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get(this._profileURL + '?' + parameters, {}, function (err, res, payload) {
        if (err) return callback(err);

        try {
            payload = JSON.parse(payload);
        } catch (e) {
            return callback(e.message);
        }

        return callback(null, payload.data);
    });
};

/**
 * onProcessProfile hook
 * We format the profiles received here into the provider format
 *
 * For Instagram the results is in the tokens array, this is because they give the account info with the tokens
 */
Strategy.prototype.onProcessProfiles = function(tokens, user, callback) {
    var formattedProfile = {
        userId: user.id,
        account: {
            username: user.username,
            userFullName: user.full_name,
            avatar: user.profile_picture
        },
        tokens: {
            accessToken: tokens.access_token
        }
    };

    var profiles = [];
    profiles.push(formattedProfile);

    return callback(null, profiles);
};

Strategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    try {
        data = JSON.parse(data);

        if (data.meta && data.meta.code == 400) {
            switch (data.meta.error_type) {
                case "OAuthPermissionsException":
                    return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1006 });
                    break;
                case "OAuthAccessTokenException":
                    return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
                    break;
            }
        }
    } catch (e) {
        console.log(data);
        return callback(e.message);
    }

    return callback(null);
};

module.exports = function(options) {
    return new Strategy(options);
};
