var util            = require('util');
var Wreck           = require('wreck');
var urlFormatter    = require('../../../lib/urlFormatter');
var BaseStrategy    = require('./Base');
var url             = require('url');
var OAuth2          = require('oauth').OAuth2;

function OAuth2Strategy(options) {
    options = options || {};
    options.clientID = options.clientID || "";
    options.clientSecret = options.clientSecret || "";
    options.callbackURL = options.callbackURL || "";
    options.accessTokenURL = options.accessTokenURL || "";
    options.apiURL = options.apiURL || "";
    options.grantType = options.grantType || "authorization_code";

    BaseStrategy.call(this, options);

    this._clientID = options.clientID;
    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._apiURL = options.apiURL;
    this._accessTokenURL = options.accessTokenURL;
    this._grantType = options.grantType;
};

/**
* Inherit from `BaseStrategy`
*/
util.inherits(OAuth2Strategy, BaseStrategy);

OAuth2Strategy.prototype.handleCallback = function(payload, callback) {
    var self = this;
    var requestToken = payload.oauth_code;

    // Exchange the oauth_token for an access_token
    this.getAccessToken(requestToken, function(err, response) {
        if (err) return callback(err);

        var tokens = response;

        // Get the user profile
        return self.getProfile(tokens, function(err, result) {
            if (err) {
                return callback(err);
            }

            if (!result) {
                return callback(null, []);
            }

            // Process Hook
            self.onProcessProfiles(response, result, function(err, providerAccounts) {
                if (err) return callback(err);
                return callback(null, providerAccounts);
            });
        });
    });
};

OAuth2Strategy.prototype.getAccessTokenByRefreshToken = function(refreshToken, callback) {
    this.getAccessToken(refreshToken, { grant_type: 'refresh_token' }, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
};

/**
 * Gets the accessToken
 * @param {string}   requestToken
 * @param {object}   options (optional)
 *
 * Params are used to overwriting parameters, accepted params:
 * - grant_type (authorization_code, refresh_token) If refresh_token then params.refresh_token = requestToken
 * @param {Function} callback
 */
OAuth2Strategy.prototype.getAccessToken = function(requestToken, options, callback) {
    // Options parameter is optional
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }

    var self = this;

    var params = {
        code : requestToken,
        client_id: this._clientID,
        client_secret: this._clientSecret,
        redirect_uri: this._callbackURL,
        grant_type: options.grant_type || this._grantType
    };

    if (params.grant_type == 'refresh_token') {
        delete params.code;
        delete params.redirect_uri;
        params.refresh_token = requestToken;
    }

    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post(this._accessTokenURL + '?' + parameters, { payload: parameters, headers: headers }, function (err, res, payload) {
        if (err) return callback(err);

        var parsedData = "";

        // If is JSON
        if (/^[\],:{}\s]*$/.test(payload.replace(/\\["\\\/bfnrtu]/g, '@')
            .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
            .replace(/(?:^|:|,)(?:\s*\[)+/g, payload))) {
            var parsed = "";

            try {
                parsed = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            return callback(null, parsed);
        }

        // Else URL string
        var parsed = url.parse("/?" + payload, true);
        return callback(null, parsed.query);
    });
};

//@todo: Put this in it's own file, preferably a formatter class?
OAuth2Strategy.prototype.onProcessProfiles = function(accessToken, expireTime, result) {
    return [];
};

OAuth2Strategy.prototype.getProfile = function(tokens, callback) {
    return callback(null, {});
};

OAuth2Strategy.prototype.getAvatar = function(accessToken, userId, callback) {
    return callback(null, "");
};

OAuth2Strategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    return callback(null);
};

module.exports = OAuth2Strategy;
