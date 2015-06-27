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
    options.accessTokenURL = options.accessTokenURL || 'https://graph.facebook.com/oauth/access_token';
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    OAuth2Strategy.call(this, options);

    this.name = 'facebook';
    this._apiURL = options.apiURL;
    this._profileURL = options.profileURL || options.apiURL + '/me';
};

/**
 * Inherit from `OAuth2Strategy`
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * onProcessProfile hook
 * We format the profiles received here into the provider format
 */
Strategy.prototype.onProcessProfiles = function(tokens, user, callback) {
    var formattedProfile = {
        userId: user.id,
        account: {
            username: user.name,
            userFullName: user.name,
            avatar: this._apiURL + '/' + user.id + '/picture?access_token=' + tokens.access_token
        },
        tokens: {
            accessToken: tokens.access_token,
            expires: tokens.expires_in
        }
    };

    var profiles = [];
    profiles.push(formattedProfile);

    return callback(null, profiles);
};

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

        return callback(null, payload);
    });
};

Strategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    try {
        data = JSON.parse(data);
    } catch (e) {
        return callback(e.message);
    }

    if (data.error) {
        switch (data.error.code) {
            //case 2500:
            case 190:
                return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
                break;

            // API Permission Denied
            case 10:
            case (data.error.code > 200 && data.error.code < 299):
                return callback(data.error.message);
                break;

            default:
                return callback(data.error.message);
        }
    }

    return callback(null);
};

module.exports = function(options) {
    return new Strategy(options);
};
