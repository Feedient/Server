var async		   	 = require('async');
var workspaceService = require('../services/workspace');

/**
 * Creates a workspace with the given name
 *
 * Parameters needed:
 * request.auth.credentials
 * request.payload.name
 *
 * @param {object} request
 * @param {object} reply
 */
exports.createWorkspace = function(request, reply) {
    var user = request.auth.credentials;
    var name = request.payload.name;

    workspaceService.create(user, name, function(err, workspace) {
        if (err) return reply({ error: err });
        return reply(workspace);
    });
};

/**
 * Deletes the given workspace
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.deleteWorkspace = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;

    workspaceService.remove(user, workspaceId, function(err, success) {
        if (err) return reply({ error: err });
        return reply({ success: success });
    });
};

/**
 * Adds a user too the given workspace
 *
 * Parameters needed:
 * request.auth.credentials
 * request.payload.userToAddId
 * request.params.workspaceId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.addUser = function(request, reply) {
    var user = request.auth.credentials;
    var userToAddId = request.payload.userToAddId;
    var workspaceId = request.params.workspaceId;

    workspaceService.addUser(user, userToAddId, workspaceId, function(err, success) {
        if (err) return reply({ error: err });
        return reply({ success: success });
    });
};

/**
 * Removes a user from the given workspace
 *
 * Parameters needed:
 * request.auth.credentials
 * request.payload.userToRemoveId
 * request.params.workspaceId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.removeUser = function(request, reply) {
    var user = request.auth.credentials;
    var userToRemoveId = request.payload.userToRemoveId;
    var workspaceId = request.params.workspaceId;

    workspaceService.removeUser(user, userToRemoveId, workspaceId, function(err, success) {
        if (err) return reply({ error: err });
        return reply({ success: success });
    });
};

/**
 * Updates the given workspace
 *
 * Parameters needed:
 * request.auth.credentials
 * request.payload.name
 * request.params.workspaceId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.updateWorkspace = function(request, reply) {
    var user = request.auth.credentials;
    var name = request.payload.name;
    var workspaceId = request.params.workspaceId;

    var updates = {};

    // If passwords set, update password
    if (name) {
        updates.updateName = function(callback) {
            workspaceService.updateName(user, workspaceId, name, function(err, success) {
                if (err) return callback(err);
                return callback(null);
            });
        };
    }

    // Process the updates
    async.parallel(updates, function(err, results) {
        if (err) return reply({ error: err });
        return reply(results);
    });
};
