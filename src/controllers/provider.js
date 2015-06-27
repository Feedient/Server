var providerService = require('../services/provider');

exports.getProvider = function (request, reply) {
	var providerId = request.params.id.toString();

	providerService.getProvider(providerId, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * Gets the providers for your account
 */
exports.getProviders = function (request, reply) {
	var userEntity = request.auth.credentials;

	providerService.getProviders(userEntity, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * Delete a provider from the user his/her account
 * @param {number} id
 */
exports.deleteProvider = function (request, reply) {
	var userEntity = request.auth.credentials;
	var providerId = request.params.id;

	providerService.deleteProvider(userEntity, providerId, function(err, isSuccess) {
		if (err) return reply({ error: err });
		return reply({ success: isSuccess });
	});
};

/**
 * Update the given provider
 * fields to update:
 * - order
 */
exports.updateProvider = function (request, reply) {
	var userEntity = request.auth.credentials;
	var providerId = request.params.id;
	var newOrder = request.body.order;
	var newProviderTokens = request.body.providerTokens;

	providerService.updateProvider(userEntity, providerId, newOrder, newProviderTokens, function(err, isSuccess) {
		if (err) return reply({ error: err });
		return reply({ success: isSuccess });
	});
};

/**
 * If we need a request token, call this url (Not all providers support this)
 */
exports.getRequestToken = function (request, reply) {
	var providerName = request.params.name;

	providerService.getRequestToken(providerName, function(err, oAuthToken, oAuthTokenSecret) {
		if (err) return reply({ error: err });
		return reply({ oauth_token: oAuthToken, oauth_secret: oAuthTokenSecret });
	});
};

/**
 * Call the provider it's callback function, this will add the provider to the user his/her account
 */
exports.createProvider = function (request, reply) {
	var userEntity = request.auth.credentials;
	var providerName = request.params.name;
	var requestPayload = request.payload;

	providerService.createProvider(userEntity, providerName, requestPayload, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * Get the feed from the user provider, older than a specified time
 */
exports.getOlderFeed = function (request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;
	var from = request.params.from;

	providerService.getOlderFeed(userEntity, userProviderId, from, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * Gets the pages of the given userProvider
 * @param {object} request
 * @param {object} reply
 */
exports.getPages = function(request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;

	providerService.getPages(userEntity, userProviderId, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * Get the feed from the user provider
 */
exports.getFeed = function (request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;

	providerService.getFeed(userEntity, userProviderId, function(err, posts) {
		if (err) return reply({ error: err });
		return reply({
			provider: userProviderId,
			posts: posts
		});
	});
};

/**
 * Get the notifications from the user provider
 * @param Object request
 * @param Function reply
 */
exports.getNotifications = function (request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;

	providerService.getNotifications(userEntity, userProviderId, function(err, notifications) {
		if (err) return reply({ error: err });
		return reply({
			provider: userProviderId,
			notifications: notifications
		});
	});
};

exports.getPost = function (request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;
	var postId = request.params.postId;

	providerService.getPost(userEntity, userProviderId, postId, function(err, post) {
		if (err) return reply({ error: err });
		return reply({
			provider: userProviderId,
			postId: postId,
			post: post
		});
	});
};

exports.getPostComments = function (request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;
	var postId = request.params.postId;
	var beforeTime = request.query.beforeTime || null;
	var limit = request.query.limit || null;
	var userId = request.query.userId || null;

	providerService.getPostComments(userEntity, userProviderId, postId, beforeTime, limit, userId, function(err, providerId, postId, comments, parentComments, hasMoreComments, postLink) {
		if (err) return reply({ error: err });

		var resultJson = {
			provider: providerId,
			postId: postId,
			comments: comments,
			parents: parentComments,
			has_more_comments: hasMoreComments,
			post_link: postLink
		};

		return reply(resultJson);
	});
};

exports.doAction = function (request, reply) {
	var userEntity = request.auth.credentials;
	var userProviderId = request.params.userProviderId;
	var actionMethod = request.params.actionMethod;
	var payloadData = request.payload;

	providerService.doAction(userEntity, userProviderId, actionMethod, payloadData, function(err, actionResult) {
		if (err) return reply({ error: err });
		return reply({ success: true, data: actionResult });
	});
};
