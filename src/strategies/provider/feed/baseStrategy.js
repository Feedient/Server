'use strict';

function BaseStrategy() {

};

/**
 * Gets the user his/her feed
 */
BaseStrategy.prototype.getFeed = function(userProvider, timeSince, timeUntil, limit, feedCallback) {
    return feedCallback(null, []);
};

BaseStrategy.prototype.getPost = function(userProvider, postId, callback) {
    return callback(null, {});
};

/**
 * Gets the comments for a post
 *
 * @api-method POST
 * @api-url    /provider/:userProviderId/:postId/comments
 * @api-body   beforeTime
 * @api-body   limit
 *
 * @param  {UserProvider}   userProvider
 * @param  {int}            postId
 * @param  {array}   		body 			[Needs: body.beforeTime, body.limit]
 * @param  {Function} 		callback(err, comments, parentComments, postLink, hasMoreComments)
 * @return {array}
 */
BaseStrategy.prototype.getPostComments = function(userProvider, postId, beforeTime, limit, userId, callback) {
    return callback(null, [], [], "", false)
};

/**
 * Process the comments to a unified format
 */
BaseStrategy.prototype.processComment = function(comment, userProvider) {
    return null;
};

/**
 * Process the post and unify it
 */
BaseStrategy.prototype.processPost = function (post, userProvider) {
    return null;
};

module.exports = BaseStrategy;
