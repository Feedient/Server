var workspaceService            = require('./workspace');
var Panel                       = require('../entities/panel');
var UserProvider                = require('../entities/userProvider');
var config                      = require('../../config/app');
var async                       = require('async');
var PanelType                   = require('../enum/panelType');
var util                        = require('../util/object');
var mongoose                    = require('mongoose');
var abstractFactoryPanelType    = require('../abstract_factories/panelType');
var extend                      = require('util')._extend;
var providersStrategy           = require('../strategies/providers');
var providerService             = require('./provider');

/**
 * Create a panel in the workspace with the given id
 * @param  {object}   userEntity  the user creating the panel
 * @param  {string}   workspaceId
 * @param  {string}   name
 * @param  {PanelType enum}   type
 * @param  {Function} callback
 * @return {err, panelObject}
 */
exports.create = function(userEntity, workspaceId, name, type, providerAccounts, size, callback) {
    if (typeof providerAccounts === 'function') {
        callback = providerAccounts;
        providerAccounts = [];
        size = 1;
    }

    if (typeof size === 'function') {
        callback = size;
        size = 1;
    }

    async.waterfall([
        // Check if the type is defined in the panelType.js enum
        function(callback) {
            var values = util.getObjectValues(PanelType);

            if (values.indexOf(type) == -1) {
                return callback('errors.PANEL_INCORRECT_TYPE');
            }

            return callback();
        },
        // Check if the name is not empty
        function(callback) {
            if (name == "") {
                return callback('errors.PANEL_EMPTY_NAME');
            }

            return callback();
        },
        // Check if the workspace exists
        function(callback) {
            workspaceService.getWorkspaceById(workspaceId, function(err, workspace) {
                if (err) return callback(err);
                return callback();
            });
        },
        // Check if we own the workspace
        function(callback) {
            workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err) {
                if (err) return callback(err);
                return callback();
            });
        },
        // Check if we got a panel with the given name already
        function(callback) {
            Panel.hasPanelWithWorkspaceIdAndName(workspaceId, name, function(err) {
                if (err) return callback(err);
                return callback();
            });
        },
        // Create the panel
        function(callback) {
            var newPanel = new Panel({
                workspaceId: workspaceId,
                name: name,
                type: type,
                providerAccounts: providerAccounts || [],
                size: size
            });

            newPanel.save(function(err) {
                if (err) return callback(err);
                return callback(null, newPanel);
            });
        }
    ],
    // Return the result or error
    function(err, newPanel) {
        if (err) return callback(err);
        return callback(null, newPanel);
    });
};

exports.getPanelsByWorkspaceId = function(userEntity, workspaceId, callback) {
    workspaceService.userHasAccessToWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getByWorkspaceId(workspaceId, function(err, panels) {
            if (err) return callback(err);
            return callback(null, panels);
        });
    });
};

/**
 * Returns an array of the workspaces where the field panels is added
 * the field panels then holds the panel documents
 * @param {object}   userEntity
 * @param {string}   workspaceId
 * @param {Function} callback
 */
exports.getPanelsAndWorkspaces = function(userEntity, callback) {
    var self = this;

    workspaceService.getWorkspacesByUser(userEntity, function(err, workspaces) {
        async.map(workspaces, function(workspace, mapCallback) {

            // Get panels
            self.getPanelsByWorkspaceId(userEntity, workspace._id, function(err, panels) {
                if (err) return mapCallback(err);

                var transformedWorkspace = JSON.parse(JSON.stringify(workspace)); // Deep Copy over the value
                transformedWorkspace.panels = panels;

                return mapCallback(null, transformedWorkspace);
            });
        }, function(err, workspacesWithPanelsMapped) {
            if (err) return callback(err);
            return callback(null, workspacesWithPanelsMapped);
        });
    });
};

exports.getPanelById = function(userEntity, workspaceId, panelId, callback) {
    workspaceService.userHasAccessToWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return callback(err);
            return callback(null, panel);
        });
    });
};

exports.updateName = function(userEntity, workspaceId, panelId, newName, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return callback(err);

            panel.setName(newName, function(err, success) {
                if (err) return callback(err);
                return callback(null, true);
            });
        });
    });
};

exports.updateProviderAccounts = function(userEntity, workspaceId, panelId, newProviderAccounts, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return callback(err);

            panel.setProviderAccounts(newProviderAccounts, function(err, success) {
                if (err) return callback(err);
                return callback(null, true);
            });
        });
    });
};

exports.updateOrder = function(userEntity, workspaceId, panelId, newOrder, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return callback(err);

            panel.setOrder(newOrder, function(err, success) {
                if (err) return callback(err);
                return callback(null, true);
            });
        });
    });
};

exports.updateSize = function(userEntity, workspaceId, panelId, newSize, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return callback(err);

            panel.setSize(newSize, function(err, success) {
                if (err) return callback(err);
                return callback(null, true);
            });
        });
    });
};

exports.addProviderAccount = function(userEntity, workspaceId, panelId, providerId, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        userEntity.hasUserProvider(providerId, function(err, userProvider) {
            if (err) return callback('errors.PANEL_NO_ACCESS_PROVIDER_ACCOUNT');

            Panel.getById(panelId, function(err, panel) {
                if (err) return callback(err);

                panel.addProviderAccount(providerId, function(err, success) {
                    if (err) return callback(err);
                    return callback(null, true);
                });
            });
        });
    });
};

exports.removeProviderAccount = function(userEntity, workspaceId, panelId, providerId, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return callback(err);

            panel.removeProviderAccount(providerId, function(err, success) {
                if (err) return callback(err);
                return callback(null, true);
            });
        });
    });
};

exports.getContent = function(userEntity, workspaceId, panelId, mainCallback) {
    workspaceService.userHasAccessToWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return mainCallback(err);

        Panel.getById(panelId, function(err, panel) {
            if (err) return mainCallback(err);

            abstractFactoryPanelType.getPanelTypeApi(panel.type, function(err, panelTypeApi) {
                if (err) return mainCallback(err);

                var contentResult = [];

                // For every userprovider of the user, get the content in the panelApi
                async.each(panel.providerAccounts, function(userProviderId, callback) {
                    // Get userprovider object
                    UserProvider.getProviderById(userProviderId, function(err, userProvider) {
                        // Get content by userprovider name
                        panelTypeApi.use(userProvider.providerName);
                        panelTypeApi.getContent(userProvider, function(err, content) {
                            if (err) return callback(err);
                            contentResult = contentResult.concat(content);
                            return callback(null);
                        });
                    });
                }, function(err) {
                    if (err) return mainCallback(err);

                    // Sort on date if it has date
                    contentResult = contentResult.sort(function(a, b) {
                        if (!a.content.date_created) a.content.date_created = new Date();
                        if (!b.content.date_created) b.content.date_created = new Date();
                        return new Date(b.content.date_created) - new Date(a.content.date_created)
                    });

                    return mainCallback(null, contentResult);
                });
            });
        });
    });
};

exports.remove = function(userEntity, workspaceId, panelId, callback) {
    workspaceService.userOwnsWorkspace(userEntity, workspaceId, function(err, workspace) {
        if (err) return callback(err);

        Panel.removeById(panelId, function(err) {
            if (err) return callback(err);
            return callback(null, true);
        });
    });
};
