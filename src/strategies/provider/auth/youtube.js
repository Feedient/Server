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
    options.accessTokenURL = options.accessTokenURL || 'https://accounts.google.com/o/oauth2/token';
    options.apiURL = options.apiURL || 'https://gdata.youtube.com/feeds/api';

    OAuth2Strategy.call(this, options);

    this.name = 'youtube';
    this._profileURL = options.profileURL || 'https://gdata.youtube.com/feeds/api/users/default';
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
    var self = this;

    var userId = user.entry.id.$t.replace('http://gdata.youtube.com/feeds/api/users/', '');

    self.getAvatar(tokens.access_token, userId, function(err, avatarURL) {
        if (err) return;

        var formattedProfile = {
            userId: userId,
            account: {
                username: user.entry.yt$username.$t,
                userFullName: user.entry.title.$t,
                channelId: user.entry.link[0].href.replace('https://www.youtube.com/channel/', ''),
                avatar: avatarURL
            },
            tokens: {
                accessToken: tokens.access_token,
                tokenType: tokens.token_type,
                expiresIn: tokens.expires_in,
                refreshToken: tokens.refresh_token
            }
        };

        var profiles = [];
        profiles.push(formattedProfile);

        return callback(null, profiles);
    });
};

Strategy.prototype.getProfile = function(tokens, callback) {
    var self = this;
    var params = {
        access_token : tokens.access_token,
        alt: 'json'
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

/**
{
    "version": "1.0",
    "encoding": "UTF-8",
    "entry": {
        "xmlns": "http://www.w3.org/2005/Atom",
        "xmlns$media": "http://search.yahoo.com/mrss/",
        "xmlns$yt": "http://gdata.youtube.com/schemas/2007",
        "title": {
            "$t": "Xavier Geerinck",
            "type": "text"
        },
        "media$thumbnail": {
            "url": "http://yt3.ggpht.com/-fsawJJUhR7s/AAAAAAAAAAI/AAAAAAAAAAA/PA9HteOYyrY/s88-c-k-no/photo.jpg"
        },
        "yt$username": {
            "$t": "thebillkidy1410"
        }
    }
}
 */
Strategy.prototype.getAvatar = function(accessToken, userId, callback) {
    var self = this;
    var params = {
        access_token : accessToken,
        fields: 'yt:username,media:thumbnail,title',
        alt: 'json',
        format: 5
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get('http://gdata.youtube.com/feeds/api/users/' + userId + '?' + parameters, {}, function (err, res, payload) {
        if (err) return callback(err);

        try {
            payload = JSON.parse(payload);
        } catch (e) {
            return callback(e.message);
        }

        var avatarURL = payload['entry']['media$thumbnail']['url'] || "";
        return callback(null, avatarURL);
    });
};

Strategy.prototype.checkAccessToken = function(userProvider, data, callback) {
    var self = this;

    // No YouTube account on this G+ Account
    if(data.indexOf("NoLinkedYouTubeAccount") > -1) {
        return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1005 });
    }
    // Forbidden
    else if(data.indexOf("Forbidden") > -1) {
        return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
    }
    // Invalid developer key
    else if(data.indexOf("Invalid developer key") > -1) {
        return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1006 })
    }
    // Invalid token, get a new one
    else if (data.indexOf("Token invalid") > -1 || userProvider.providerTokens.accessToken == null) {
        // Get a new access token if error
        return self.getAccessTokenByRefreshToken(userProvider.providerTokens.refreshToken, function (err, result) {
            if (err) return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });

            // Set the token
            var tokens = {
                accessToken: result.access_token,
                refreshToken: userProvider.providerTokens.refreshToken,
                expires: result.expires_in,
                tokenType: 'Bearer'
            };

            return userProvider.updateTokens(tokens, function (err) {
                if (err) return callback({ providerId: userProvider._id, type: 'OAuthException', code: 1000 });
                userProvider.providerTokens = tokens;
                return callback(null, userProvider);
            });
        });
    } else {
        return callback(null);
    }
};

module.exports = function(options) {
    return new Strategy(options);
};
