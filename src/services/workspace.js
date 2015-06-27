var Workspace       = require('../entities/workspace');
var config          = require('../../config/app');
var async		   	= require('async');

/**
 * Creates a Workspace with the userEntity as Creator
 * @param  {object}   userEntity the User that created this, always has access to this workspace
 * @param  {string}   name, default: My Workspace
 * @param  {array}    users, default: []
 * @param  {Function} callback
 * @return {err, newWorkspace}
 */
exports.create = function(userEntity, name, users, callback) {
    if (typeof users === 'function') {
        callback = users;
        users = [];
    }

    async.waterfall([
        // Create the workspace
        function(callback) {
            var newWorkspace = new Workspace({
                name: name || "My Workspace",
                creator: userEntity._id,
                users: users || []
            });

            newWorkspace.save(function(err) {
                if (err) return callback(err);
                return callback(null, newWorkspace);
            });
        }
    ],
    // Return the result or error
    function(err, newWorkspace) {
        if (err) return callback(err);
        return callback(null, newWorkspace);
    });
};

/**
 * Sets the name of the workspace with id
 * @param  {object}   userEntity
 * @param  {string}   workspaceId
 * @param  {string}   newName
 * @param  {Function} callback
 * @return {err, result}
 */
exports.updateName = function(userEntity, workspaceId, newName, callback) {
    Workspace.userOwnsWorkspace(userEntity._id, workspaceId, function(err, workspace) {
        if (err) return callback(err);
        if (!workspace) return callback('errors.WORKSPACE_WRONG_CREATOR');

        workspace.setName(newName, function(err, result) {
            if (err) return callback(err);
            return callback(null, result);
        });
    });
};

/**
 * Removes the workspace with id of the given user
 * @param  {object}   userEntity
 * @param  {string}   workspaceId
 * @param  {Function} callback
 * @return {err, success}
 */
exports.remove = function(userEntity, workspaceId, callback) {
    Workspace.userOwnsWorkspace(userEntity._id, workspaceId, function(err, workspace) {
        if (err) return callback(err);
        if (!workspace) return callback('errors.WORKSPACE_WRONG_CREATOR');

        Workspace.getWorkspaceByUser(userEntity._id, function(err, workspaces) {
            if (err) return callback(err);
            if (workspaces.length <= 1) return callback('errors.WORKSPACE_ERR_NEED_ONE_LEFT');

            workspace.remove(function(err) {
                if (err) return callback(err);
                return callback(null, true);
            });
        });
    });
};

/**
 * Add the user to the given workspace
 * @param {object}   userEntity
 * @param {string}   userToAddId
 * @param {stromg}   workspaceId
 * @param {Function} callback
 */
exports.addUser = function(userEntity, userToAddId, workspaceId, callback) {
    Workspace.userOwnsWorkspace(userEntity._id, workspaceId, function(err, workspace) {
        if (err) return callback(err);
        if (!workspace) return callback('errors.WORKSPACE_WRONG_CREATOR');

        workspace.addUser(userToAddId, function(err, success) {
            if (err) return callback(err);
            return callback(null, success);
        });
    });
};

/**
 * Removes the user from the given workspace
 * @param {object}   userEntity
 * @param {string}   userToRemoveId
 * @param {string}   workspaceId
 * @param {Function} callback
 */
exports.removeUser = function(userEntity, userToRemoveId, workspaceId, callback) {
    this.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        workspace.removeUser(userToRemoveId, function(err, success) {
            if (err) return callback(err);
            return callback(null, success);
        });
    });
};

exports.getWorkspaceById = function(workspaceId, callback) {
    return Workspace.getWorkspaceById(workspaceId, callback);
};

/**
 * Does the given user owns the workspace with the given id?
 * @param {object}   userEntity
 * @param {string}   workspaceId
 * @param {Function} callback
 */
exports.userOwnsWorkspace = function(userEntity, workspaceId, callback) {
    Workspace.userOwnsWorkspace(userEntity._id, workspaceId, function(err, workspace) {
        if (err) return callback(err);
        if (!workspace) return callback('errors.WORKSPACE_WRONG_CREATOR');
        return callback(null, workspace);
    });
};

/**
 * Does the given user has access to the workspace with the given id?
 * @param {object}   userEntity
 * @param {string}   workspaceId
 * @param {Function} callback
 */
exports.userHasAccessToWorkspace = function(userEntity, workspaceId, callback) {
    Workspace.userHasAccessToWorkspace(userEntity._id, workspaceId, function(err, workspace) {
        if (err) return callback(err);
        return callback(null, workspace);
    });
};

exports.getWorkspace = function(userEntity, workspaceId, callback) {
    Workspace.userHasAccessToWorkspace(userEntity._id, workspaceId, function(err, workspace) {
        if (err) return callback(err);
        return callback(null, workspace);
    });
};

exports.getWorkspacesByUser = function(userEntity, callback) {
    return Workspace.getWorkspaceByUser(userEntity._id, callback);
};

exports.getWorkspacesThatUserCreated = function(userEntity, callback) {
    return Workspace.getWorkspacesThatUserCreated(userEntity._id, callback);
};
