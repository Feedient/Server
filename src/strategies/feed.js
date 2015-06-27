var async = require('async');

function FeedAPI() {
    this.name = 'FeedAPI';
    this.strategy = null;
};

FeedAPI.prototype.use = function(providerStrategy) {
    this.strategy = providerStrategy;
};

/**
 * Get the feed for the given UserProvider, Also automatically parse it to the unified format
 * @param {object} userProvider
 * @param {int} timeSince
 * @param {int} timeUntil
 * @param {int} limit
 * @param {object} feedCallback
 */
FeedAPI.prototype.getFeed = function(userProvider, timeSince, timeUntil, limit, feedCallback) {
    var self = this;

    async.waterfall([
        // Get Feed
        function(callback){
            self.strategy.getFeed(userProvider, timeSince, timeUntil, limit, function(err, posts) {
                if (err) return callback(err);
                return callback(null, posts);
            });
        },
        // Process posts through their processPost algorithm
        function(posts, callback) {
            if (!posts) return callback("Posts is undefined");
            // Process all posts
            async.map(posts, function(post, cb) {
                if (!post) return cb(null, null);
                var transformedPost = self.processPost(post, userProvider);
                return cb(null, transformedPost);
            }, function(err, transformedPosts) {
                if (err) return callback(err);
                return callback(null, transformedPosts);
            });
        },
        // Remove posts that are null
        function(posts, callback) {
            async.filter(posts, function(post, cb) {
                if (post == null || undefined) return cb(false);
                return cb(true);
            }, function(posts) {
                return callback(null, posts);
            });
        },
        // If timeSince is set, only return the posts with the timeSince newer then
        function(posts, callback) {
            // If no timesince, continue
            if (!timeSince) {
                return callback(null, posts);
            }

            // Remove posts that are older then timeSince
            async.filter(posts, function(post, cb) {
                if (post.pagination.since < timeSince) return cb(false);
                return cb(true);
            }, function(posts) {
                return callback(null, posts);
            });
        }
    ],
    // optional callback
    function(err, posts){
        if (err) return feedCallback(err);

        // Sort the posts descending
        posts = posts.sort(function(a, b) {
            return new Date(b.content.date_created) - new Date(a.content.date_created)
        });

        // Return the posts
        return feedCallback(null, posts);
    });
};

FeedAPI.prototype.getPost = function(userProvider, postId, postCallback) {
    var self = this;

    async.waterfall([
        // Get Feed
        function(callback){
            self.strategy.getPost(userProvider, postId, function(err, post) {
                if (err) return callback(err);
                return callback(null, post);
            });
        },
        // Process posts through their processPost algorithm
        function(post, callback) {
            if (!post) return callback("Post is undefined");

            var transformedPost = self.processPost(post, userProvider);
            return callback(null, transformedPost);
        }
    ],
    // Return the post
    function(err, post){
        if (err) return postCallback(err);
        return postCallback(null, post);
    });
};

FeedAPI.prototype.getPostComments = function(userProvider, postId, beforeTime, limit, userId, commentCallback) {
    var self = this;

    async.waterfall([
        // Get Feed
        function(callback){
            self.strategy.getPostComments(userProvider, postId, beforeTime, limit, userId, function(err, comments, parentComments, postLink, hasMoreComments) {
                if (err) return callback(err);
                return callback(null, comments, parentComments, postLink, hasMoreComments);
            });
        },
        // Process posts through their processPost algorithm
        function(comments, parentComments, postLink, hasMoreComments, callback) {
            if (!comments) return callback("Comments is undefined");
            // Process all posts
            async.map(comments, function(comment, cb) {
                if (!comment) return cb(null, null);
                var transformedComment = self.processComment(comment, userProvider);
                return cb(null, transformedComment);
            }, function(err, transformedComments) {
                if (err) return callback(err);
                return callback(null, transformedComments, parentComments, postLink, hasMoreComments);
            });
        },
        // Remove comments that are null
        function(comments, parentComments, postLink, hasMoreComments, callback) {
            async.filter(comments, function(comment, cb) {
                if (comment == null || undefined) return cb(false);
                return cb(true);
            }, function(comments) {
                return callback(null, comments, parentComments, postLink, hasMoreComments);
            });
        },
    ],
    // Return the comments
    function(err, comments, parentComments, postLink, hasMoreComments){
        if (err) return commentCallback(err);

        // Sort the posts descending
        comments = comments.sort(function(a, b) {
            return new Date(b.content.date_created) - new Date(a.content.date_created)
        });

        return commentCallback(null, userProvider._id, postId, comments, parentComments, hasMoreComments, postLink);
    });
};

FeedAPI.prototype.processComment = function(comment, accessToken) {
    return this.strategy.processComment(comment, accessToken);
};

FeedAPI.prototype.processPost = function (post, userProvider) {
    return this.strategy.processPost(post, userProvider);
};

module.exports = FeedAPI;
