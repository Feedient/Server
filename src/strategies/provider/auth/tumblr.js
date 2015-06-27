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
    options.accessTokenURL = options.accessTokenURL || 'http://www.tumblr.com/oauth/access_token';
    options.requestTokenURL = options.requestTokenURL || 'http://www.tumblr.com/oauth/request_token';
    options.apiURL = options.apiURL || 'https://api.tumblr.com/v2';

    OAuthStrategy.call(this, options);

    this.name = 'tumblr';
    this._profileURL = options.profileURL || options.apiURL + '/user/info';
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
        userId: user.response.user.name,
        account: {
            username: user.response.user.name,
            userFullName: user.response.user.name,
            avatar: 'https://api.tumblr.com/v2/blog/' + user.response.user.name + '.tumblr.com/avatar'
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
            return callback(null, account);
        } catch (e) {
            return callback(e.message);
        }
    });
};

Strategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    try {
        var parsedData = JSON.parse(data);

        if (parsedData.meta && parsedData.meta.status) {
            switch (parsedData.meta.status) {
                case 401:
                    return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
                    break;
                case 88:
                    return callback('errors.OAUTH_RATE_LIMIT_REACHED');
                    break;
                case 89:
                    return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
                    break;
            }
        }
    } catch (e) {
        return callback(e.message);
    }

    return callback(null, data);
};

module.exports = function(options) {
    return new Strategy(options);
};
