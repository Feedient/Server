'use strict';

var util                = require('util');
var BaseStrategy        = require('./baseStrategy');
var async               = require('async');
var Wreck			  	= require('wreck');
var msgFormatter 	   	= require('../../../lib/msgFormatter');
var urlFormatter 	   	= require('../../../lib/urlFormatter');
var requestLib 	        = require('request');
var fs                  = require('fs');

/**
 * The Facebook Provider strategy wraps the Facebook API
 */
function Strategy(authStrategy, options) {
    if (!authStrategy) { throw new TypeError('FeedAPI requires an authentication strategy.') }
    if (!options.apiURL) { throw new TypeError('FeedAPI Strategy requires a apiURL option.') }

    options = options || {};
    options.apiURL = options.apiURL || 'https://graph.facebook.com/v2.1';

    BaseStrategy.call(this, options);

    this.name = 'facebook';
    this._apiURL = options.apiURL;
    this.authStrategy = authStrategy;

    this._composeURL = this._apiURL + '/me/feed';
    this._composeWithPictureURL = this._apiURL + '/me/photos';
};

/**
 * Inherit from `BaseStrategy`
 */
util.inherits(Strategy, BaseStrategy);

/**
 * Create a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/compose/
 * @api-body   message
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.message]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.compose = function(userProvider, payloadData, callback) {
    if (!payloadData.message) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        message: payloadData.message
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post(self._composeURL, { payload: parameters }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload['id']);
        });
    });
};

/**
 * @api-method POST
 * @api-url    /provider/:id/actions/postImage
 * @api-body   image, message
 *
 * Image should be encoded as multipart/form-data (Means encoded as form data)
 *
 * @param userProvider
 * @param request
 * @param callback
 * @returns {*}
 */
Strategy.prototype.composeWithPicture = function(userProvider, payloadData, callback) {
    if (!payloadData.picture) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    // Start uploading
    var req = requestLib.post(self._composeWithPictureURL + '?access_token=' + userProvider.providerTokens.accessToken, function(err, res, body) {
        // Return err if any
        if (err) return callback(err);

        try {
            body = JSON.parse(body);
        } catch (e) {
            return callback(e);
        }

        return callback(null, body.post_id);
    });

    // Pipe our data to it
    var form = req.form();
    form.append('source', fs.createReadStream("/tmp/" + payloadData.picture.filename));
    if (payloadData.message) form.append('message', payloadData.message);
}

/**
 * Deletes a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/delete/
 * @api-body   post_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.post_id]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.delete = function(userProvider, payloadData, callback) {
    if (!payloadData.post_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.delete(self._apiURL + "/" + payloadData.post_id + '?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload.data);
        });
    });
};

/**
 * Likes a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/like/
 * @api-body   post_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.post_id]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.like = function(userProvider, payloadData, callback) {
    if (!payloadData.post_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post(self._apiURL + "/" + payloadData.post_id + '/likes?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload.data);
        });
    });
};

/**
 * Comments on a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/comment/
 * @api-body   post_id, comment_message
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.post_id, body.comment_message]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.comment = function(userProvider, payloadData, callback) {
    if (!payloadData.post_id || !payloadData.comment_message) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        message: payloadData.comment_message
    };

    params = urlFormatter.serialize(params);

    Wreck.post(self._apiURL + "/" + payloadData.post_id + '/comments', { payload: params  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload.data);
        });
    });
};

/**
 * Deletes a comment on a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/deletecomment/
 * @api-body   comment_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.comment_id]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.deletecomment = function(userProvider, payloadData, callback) {
    if (!payloadData.comment_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.get(self._apiURL + "/" + payloadData.comment_id + '?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);

            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload.data);
        });
    });
};

/**
 * Deletes a like on a post
 *
 * @api-method POST
 * @api-url    /provider/:id/actions/unlike/
 * @api-body   post_id
 *
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.post_id]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.unlike = function(userProvider, payloadData, callback) {
    if (!payloadData.post_id) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.delete(self._apiURL + "/" + payloadData.post_id + '/likes?' + parameters, {  }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload.data);
        });
    });
};

/**
 * @tody
 * Shares a post
 * @param  {OAuth}   		OAuth
 * @param  {UserProvider}   userProvider
 * @param  {array}   		body 			[Needs: body.post_id, body.message]
 * @param  {Function} 		callback
 * @return {array}
 */
Strategy.prototype.share = function(userProvider, payloadData, callback) {
    if (!payloadData.post_id || !payloadData.message) {
        return callback('errors.FORM_EMPTY_FIELDS');
    }

    var self = this;

    var params = {
        access_token: userProvider.providerTokens.accessToken,
        message: payloadData.message
    };

    var parameters = urlFormatter.serialize(params);
    Wreck.post(self._apiURL + '/me/feed', { payload: parameters }, function (err, res, payload) {
        if (err) return callback(err);

        // Verify Access Token validity
        self.authStrategy.checkAccessToken(userProvider, payload, function (err) {
            if (err) return callback(err);
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                return callback(e.message);
            }

            if (payload.error) return callback(payload.error.message);
            return callback(null, payload['id']);
        });
    });

    //https://www.facebook.com/ajax/sharer/?s=99&appid=2309869772&p%5B0%5D=306841793100&p%5B1%5D=10151738154318101&profile_id=1470077194&share_source_type=unknown
};

module.exports = Strategy;
