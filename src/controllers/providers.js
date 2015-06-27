var providersService = require('../services/providers');

/**
 * The structure of the JSON being received looks like this:
 * [
 *     {
 *         providerId: "IDHERE",
 *         until: "ID/DATE/...HERE"
 *     },
 *     {
 *         providerId: "IDHERE",
 *         until: "ID/DATE/...HERE"
 *     }
 * ]
 */
exports.getOlderPosts = function(request, reply) {
	var userEntity = request.auth.credentials;
	var objects = request.payload.objects;

	providersService.getOlderPosts(userEntity, objects, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * This gets newer posts for the providers specified
 *
 * The structure of the JSON being received looks like this:
 * [
 *     {
 *         providerId: "IDHERE",
 *         since: "ID/DATE/...HERE"
 *     },
 *     {
 *         providerId: "IDHERE",
 *         since: "ID/DATE/...HERE"
 *     }
 * ]
 *
 * This structure has been created so we can have a variable since, this
 * because facebook uses date, twitter uses a postId, ...
 *
 * @param {Object} request
 * @param {Object} reply
 */
exports.getNewerPosts = function(request, reply) {
	var userEntity = request.auth.credentials;
	var objects = request.payload.objects;

	providersService.getNewerPosts(userEntity, objects, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

/**
 * JSON Structure
 * [
 *     "providerid1",
 *     "providerid2"
 * ]
 *
 * @param {Object} request
 * @param {Object} reply
 */
exports.getFeeds = function(request, reply) {
	var userEntity = request.auth.credentials;
	var providers = request.payload.providers;
	var amountOfPosts = request.payload.amount || 30;

	providersService.getFeeds(userEntity, providers, amountOfPosts, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

exports.updateOrder = function (request, reply) {
	var userEntity = request.auth.credentials;
	var providerOrders = request.payload.providerOrder;

	providersService.updateOrder(userEntity, providerOrders, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

exports.compose = function (request, reply) {
	var userEntity = request.auth.credentials;
	var providers = request.payload.providers;
	var payloadData = request.payload;

	providersService.compose(userEntity, providers, payloadData, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};

exports.composeWithPicture = function(request, reply) {
	var userEntity = request.auth.credentials;
	var providers = request.payload.providers;
	var picture = request.payload.picture;
	var payloadData = request.payload;

	providersService.composeWithPicture(userEntity, providers, picture, payloadData, function(err, result) {
		if (err) return reply({ error: err });
		return reply(result);
	});
};
