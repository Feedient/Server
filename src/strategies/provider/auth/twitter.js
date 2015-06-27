var util = require('util');
var OAuthStrategy = require('./OAuthStrategy');
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
    options.accessTokenURL = options.accessTokenURL || 'https://twitter.com/oauth/access_token';
    options.requestTokenURL = options.requestTokenURL || 'https://twitter.com/oauth/request_token';
    options.apiURL = options.apiURL || 'https://api.twitter.com/1.1';

    OAuthStrategy.call(this, options);

    this.name = 'twitter';
    this._profileURL = options.profileURL || options.apiURL + '/account/verify_credentials.json';
};

/**
 * Inherit from `OAuthStrategy`
 */
util.inherits(Strategy, OAuthStrategy);

/**
 * onProcessProfile hook
 * We format the profiles received here into the provider format
 */
Strategy.prototype.onProcessProfiles = function(tokens, user, callback) {
    var formattedProfile = {
        userId: user.id_str,
        account: {
            username: user.screen_name,
            userFullName: user.name,
            avatar: user.profile_image_url_https
        },
        tokens: {
            accessToken: tokens.access_token,
            accessTokenSecret: tokens.access_token_secret
        }
    };

    var profiles = [];
    profiles.push(formattedProfile);

    return callback(null, profiles);
};

Strategy.prototype.getProfile = function(tokens, callback) {
    this._oauth.get(this._profileURL, tokens.access_token, tokens.access_token_secret, function(err, account) {
        if (err) return callback(err);

        try {
            account = JSON.parse(account);
        } catch (e) {
            return callback(e.message);
        }

        return callback(null, account);
    });
};

Strategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    try {
        var data = JSON.parse(data);
    } catch (e) {
        return callback(e.message);
    }

    if (data.errors) {
        switch (data.errors[0].code) {
            case 88:
                return callback('errors.OAUTH_RATE_LIMIT_REACHED');
                break;
            case 89:
                return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
                break;
            default:
                var message = data.errors[0].message || "";
                return callback(data.errors[0].message);
        }
    }

    return callback(null);
};

module.exports = function(options) {
    return new Strategy(options);
};
