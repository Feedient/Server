var util            = require('util');
var Wreck           = require('wreck');
var urlFormatter    = require('../../../lib/urlFormatter');
var BaseStrategy    = require('./Base');
var url             = require('url');
var OAuth           = require('oauth').OAuth;

function OAuthStrategy(options) {
    options = options || {};
    options.clientID = options.clientID || "";
    options.clientSecret = options.clientSecret || "";
    options.callbackURL = options.callbackURL || "";
    options.accessTokenURL = options.accessTokenURL || "";
    options.requestTokenURL = options.requestTokenURL || "";
    options.apiURL = options.apiURL || "";
    options.grantType = options.grantType || "authorization_code";

    BaseStrategy.call(this, options);

    this._clientID = options.clientID;
    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._apiURL = options.apiURL;
    this._accessTokenURL = options.accessTokenURL;
    this._requestTokenURL = options.requestTokenURL;
    this._grantType = options.grantType;

    this._oauth = this.getOAuth();
};

/**
* Inherit from `BaseStrategy`
*/
util.inherits(OAuthStrategy, BaseStrategy);

OAuthStrategy.prototype.getOAuth = function() {
    return new OAuth(
        this._requestTokenURL,
        this._accessTokenURL,
        this._clientID,
        this._clientSecret,
        '1.0A',
        this._callbackURL,
        'HMAC-SHA1'
    );
};

OAuthStrategy.prototype.getRequestToken = function(callback) {
    var self = this;
    self._oauth.getOAuthRequestToken(function (err, oauthToken, oauthTokenSecret, result) {
        if(err) return callback(err);
        return callback(null, oauthToken, oauthTokenSecret);
    });
};

OAuthStrategy.prototype.handleCallback = function(payload, callback) {
    var self = this;
    self._oauth.getOAuthAccessToken(payload.oauth_token, payload.oauth_secret, payload.oauth_verifier, function (err, oauthAccessToken, oauthAccessTokenSecret, response) {
        if(err) return callback(err);

        var tokens = {
            access_token: oauthAccessToken,
            access_token_secret: oauthAccessTokenSecret
        };

        // Get the user profile
        return self.getProfile(tokens, function(err, result) {
            if (err) {
                return callback(err);
            }

            // Process Hook
            self.onProcessProfiles(tokens, result, function(err, providerAccounts) {
                if (err) return callback(err);
                return callback(null, providerAccounts);
            });
        });
    });
};

//@todo: Put this in it's own file, preferably a formatter class?
OAuthStrategy.prototype.onProcessProfiles = function(accessToken, expireTime, result) {
    return [];
};

OAuthStrategy.prototype.getProfile = function(tokens, callback) {
    return callback(null, {});
};

OAuthStrategy.prototype.getAvatar = function(accessToken, userId, callback) {
    return callback(null, "");
};

OAuthStrategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    return callback(null);
};

module.exports = OAuthStrategy;
