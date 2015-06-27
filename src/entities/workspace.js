'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var WorkspaceSchema = new Schema({
    name: { type: String, required: true },
    creator: { type: ObjectId, ref: 'User', required: true },
    users: { type: Array, default: [] },
    dateAdded: { type: Date, required: true, default: Date.now }
});

WorkspaceSchema.statics.getWorkspaceByUser = function(userId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(userId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.find({ $or: [ { creator: objectId }, { users: userId.toString() }] }, function(err, workspaces) {
        if (err) return callback(err);
        return callback(null, workspaces);
    });
};

WorkspaceSchema.statics.getWorkspacesThatUserCreated = function(userId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(userId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.find({ creator: objectId }, function(err, workspaces) {
        if (err) return callback(err);
        return callback(null, workspaces);
    });
};

/**
 * Check if the workspace with Id is owned by user with Id
 * @param {string}   userId
 * @param {string}   workspaceId
 * @param {Function} callback
 */
WorkspaceSchema.statics.userOwnsWorkspace = function(userId, workspaceId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(workspaceId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.findOne({ _id: objectId, creator: userId }, function(err, workspace) {
        if (err) return callback(err);
        return callback(null, workspace);
    });
};

WorkspaceSchema.statics.userHasAccessToWorkspace = function(userId, workspaceId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(workspaceId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.findOne({ _id: objectId }, function(err, workspace) {
        if (err) return callback(err);
        if (!workspace) return callback('errors.WORKSPACE_DOES_NOT_EXIST');

        // If we are the creator, return the workspace
        if (workspace.creator.toString() == userId.toString()) {
            return callback(null, workspace);
        }

        // If we are in the users array, return the workspace
        if (workspace.users.indexOf(userId.toString()) > -1) {
            return callback(null, workspace);
        }

        // Else return no access error
        return callback('errors.WORKSPACE_NO_ACCESS');
    });
};

WorkspaceSchema.statics.getWorkspaceById = function(workspaceId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(workspaceId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.findOne({ _id: objectId }, function(err, result) {
        if (err) return callback(err);
        if (!result) return callback('errors.WORKSPACE_DOES_NOT_EXIST');
        return callback(null, result);
    });
};

/**
 * Add a user to the workspace
 * @param {string}   userToAddId
 * @param {Function} callback(err, success)
 */
WorkspaceSchema.methods.addUser = function(userToAddId, callback) {
    if (this.users.indexOf(userToAddId) > -1) {
        return callback('errors.WORKSPACE_USER_ALREADY_ADDED');
    }

    var updates = { $push: { users: userToAddId.toString() } };
    return this.update(updates, callback);
};

/**
 * Removes a user from the workspace
 * @param {string}   userToRemoveId
 * @param {Function} callback(err, success)
 */
WorkspaceSchema.methods.removeUser = function(userToRemoveId, callback) {
    if (this.users.indexOf(userToRemoveId) == -1) {
        return callback('errors.WORKSPACE_NON_EXISTING_USER');
    }

    var updates = { $pull: { users: userToRemoveId.toString() } };
    return this.update(updates, callback);
};

WorkspaceSchema.methods.setName = function(newName, callback) {
    var updates = { $set: { name: newName } };
    return this.update(updates, callback);
};

module.exports = mongoose.model('Workspace', WorkspaceSchema);
