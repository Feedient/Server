var async		   	= require('async');
var panelService    = require('../services/panel');

/**
 * Update the given panel
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 * request.payload.newName
 * request.payload.providerAccounts
 *
 * @param {object} request
 * @param {object} reply
 */
exports.update = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var panelId = request.params.panelId;
    var newName = request.payload.newName;
    var providerAccounts = request.payload.providerAccounts;
    var newSize = request.payload.newSize;
    var newOrder = request.payload.newOrder;

    var updates = {};

    // If passwords set, update password
    if (newName) {
        updates.updateName = function(callback) {
            panelService.updateName(user, workspaceId, panelId, newName, function(err, success) {
                if (err) return callback(err);
                return callback(null);
            });
        };
    }

    if (newSize) {
        updates.updateSize = function(callback) {
            panelService.updateSize(user, workspaceId, panelId, newSize, function(err, success) {
                if (err) return callback(err);
                return callback(null);
            });
        };
    }

    if (newOrder) {
        updates.updateOrder = function(callback) {
            panelService.updateOrder(user, workspaceId, panelId, newOrder, function(err, success) {
                if (err) return callback(err);
                return callback(null);
            });
        };
    }

    // On update we always update the providerAccounts because we can not send empty arrays
    updates.updateProviderAccounts = function(callback) {
        panelService.updateProviderAccounts(user, workspaceId, panelId, providerAccounts, function(err, success) {
            if (err) return callback(err);
            return callback(null);
        });
    };

    // Process the updates
    async.parallel(updates, function(err, results) {
        if (err) return reply({ error: err });
        return reply(results);
    });
};

/**
 * Update the given panels their order
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.payload.orders [{ panelId, newOrder}]
 *
 * @param {object} request
 * @param {object} reply
 */
exports.updateOrder = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var orders = request.payload.orders;

    async.each(orders, function(newOrder, callback) {
        panelService.updateOrder(user, workspaceId, newOrder.panelId, newOrder.newOrder, function(err, success) {
            if (err) return callback(err);
            return callback();
        });
    }, function(err) {
        if (err) return reply({ error: err });
        return reply({ success: true });
    })
};

/**
 * Get the content for the given panel
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.getContent = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var panelId = request.params.panelId;

    panelService.getContent(user, workspaceId, panelId, function(err, content) {
        if (typeof err === 'string') return reply({ error: request.i18n.__(err) });
        if (err) return reply({ error: err })

        return reply(content);
    });
};

/**
 * Get panel by id
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.getPanelById = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var panelId = request.params.panelId;

    panelService.getPanelById(user, workspaceId, panelId, function(err, panel) {
        if (err) return reply({ error: err });
        return reply(panel);
    });
};

/**
 * Get panels for the given workspaceId
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.getPanelsByWorkspaceId = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;

    panelService.getPanelsByWorkspaceId(user, workspaceId, function(err, panels) {
        if (err) return reply({ error: err });
        return reply(panels);
    });
};

/**
 * Create a new panel
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.payload.name
 * request.payload.type
 * request.payload.providerAccounts
 *
 * @param {object} request
 * @param {object} reply
 */
exports.createPanel = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var name = request.payload.name;
    var type = request.payload.type;
    var providerAccounts = request.payload.providerAccounts || [];

    panelService.create(user, workspaceId, name, type, providerAccounts, function(err, panel) {
        if (err) return reply({ error: err });
        return reply(panel);
    });
};

/**
 * Delete the given panel
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.deletePanel = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var panelId = request.params.panelId;

    panelService.remove(user, workspaceId, panelId, function(err, success) {
        if (err) return reply({ error: err });
        return reply({ success: success });
    });
};

/**
 * Adds a provider account to the given panel
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 * request.payload.providerAccountId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.addProviderAccount = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var panelId = request.params.panelId;
    var providerAccountId = request.payload.providerAccountId;

    panelService.addProviderAccount(user, workspaceId, panelId, providerAccountId, function(err, success) {
        if (err) return reply({ error: err });
        return reply({ success: success });
    });
};

/**
 * Removes a provider account from the given panel
 *
 * Parameters needed:
 * request.auth.credentials
 * request.params.workspaceId
 * request.params.panelId
 * request.payload.providerAccountId
 *
 * @param {object} request
 * @param {object} reply
 */
exports.removeProviderAccount = function(request, reply) {
    var user = request.auth.credentials;
    var workspaceId = request.params.workspaceId;
    var panelId = request.params.panelId;
    var providerAccountId = request.payload.providerAccountId;

    panelService.removeProviderAccount(user, workspaceId, panelId, providerAccountId, function(err, success) {
        if (err) return reply({ error: err });
        return reply({ success: success });
    });
};
