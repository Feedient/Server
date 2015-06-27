'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PanelSchema = new Schema({
    workspaceId: { type: ObjectId, required: true },
    name: { type: String, required: true },
    type: { type: Number, required: true }, // Must be defined in panelType.js enum
    order: { type: Number, required: true, default: 1 },
    providerAccounts: { type: Array, default: [] },
    dateAdded: { type: Date, required: true, default: Date.now },
    size: { type: Number, required: true, default: 1 } // The column size (example: 2 = 2 columns width, ...)
});

// Before we save the panel execute this
PanelSchema.pre('save', function(next) {
    var panel = this;

    // Get the panelCount for this workspace
    PanelModel.getPanelCountForWorkspaceId(panel.workspaceId, function(err, count) {
        if (err) return next(err);

        // Set the new order
        count++;
        panel.order = count;

        return next();
    });
});

PanelSchema.statics.getPanelCountForWorkspaceId = function(workspaceId, callback) {
    this.count({ workspaceId: mongoose.Types.ObjectId(workspaceId.toString()) }, function(err, count) {
        if (err) return callback('errors.DATABASE_SELECT_ERROR');
        return callback(null, count);
    });
};

PanelSchema.statics.hasPanelWithWorkspaceIdAndName = function(workspaceId, name, callback) {
    this.findOne({ name: name, workspaceId: mongoose.Types.ObjectId(workspaceId.toString()) }, function(err, panel) {
        if (err) return callback(err);
        if (panel) return callback('errors.PANEL_NAME_ALREADY_USED');
        return callback();
    });
};

PanelSchema.statics.removeById = function(panelId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(panelId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.remove({ _id: objectId }, function(err, removedDocs) {
        if (err) return callback(err);
        return callback(null, removedDocs);
    });
};

PanelSchema.methods.setName = function(newName, callback) {
    var updates = { $set: { name: newName.toString() } };
    return this.update(updates, callback);
};

PanelSchema.methods.setProviderAccounts = function(newProviderAccounts, callback) {
    var updates = { $set: { providerAccounts: newProviderAccounts } };
    return this.update(updates, callback);
};

PanelSchema.methods.setOrder = function(newOrder, callback) {
    var updates = { $set: { order: newOrder } };
    return this.update(updates, callback);
};

PanelSchema.methods.setSize = function(newSize, callback) {
    var updates = { $set: { size: newSize } };
    return this.update(updates, callback);
};

PanelSchema.methods.addProviderAccount = function(providerId, callback) {
    var updates = { $push: { providerAccounts: providerId.toString() } };
    return this.update(updates, callback);
};

PanelSchema.methods.removeProviderAccount = function(providerId, callback) {
    if (this.providerAccounts.indexOf(providerId) == -1) {
        return callback('errors.PANEL_PROVIDER_ACCOUNT_NOT_FOUND');
    }

    var updates = { $pull: { providerAccounts: providerId.toString() } };
    return this.update(updates, callback);
};

PanelSchema.statics.getById = function(panelId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(panelId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.findOne({ _id: objectId }, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
};

PanelSchema.statics.getByWorkspaceId = function(workspaceId, callback) {
    var objectId;

    try {
        objectId = mongoose.Types.ObjectId(workspaceId.toString());
    } catch (e) {
        return callback(e.message);
    }

    this.find({ workspaceId: objectId }, function(err, results) {
        if (err) return callback(err);
        return callback(null, results);
    });
};

var PanelModel = mongoose.model('Panel', PanelSchema);
module.exports = PanelModel;
