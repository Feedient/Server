'use strict';

var Joi	 = require('joi');
var panel = require('../../controllers/panel');

var routes = [
    {
        method: 'GET',
        path: '/panel/{workspaceId}',
        config: {
            handler: panel.getPanelsByWorkspaceId,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                }
            },
            description: 'Get the panels for the given workspaceId',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'PUT',
        path: '/panel/{workspaceId}/{panelId}',
        config: {
            handler: panel.update,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required(),
                    panelId: Joi.string().required()
                },
                payload: {
                    newName: Joi.string(),
                    newOrder: Joi.number(),
                    newSize: Joi.number(),
                    providerAccounts: Joi.array().includes(Joi.string())
                }
            },
            description: 'Updates the panel with the given id.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/panel/{workspaceId}/order',
        config: {
            handler: panel.updateOrder,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                },
                payload: {
                    orders: Joi.array().includes(
                        Joi.object({
                            panelId: Joi.string().required(),
                            newOrder: Joi.string().required()
                        })
                    )
                }
            },
            description: 'Updates the order for the given panels.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/panel/{workspaceId}/{panelId}/content',
        config: {
            handler: panel.getContent,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required(),
                    panelId: Joi.string().required()
                }
            },
            description: 'Gets the content for the given panel.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/panel/{workspaceId}/{panelId}',
        config: {
            handler: panel.getPanelById,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required(),
                    panelId: Joi.string().required()
                }
            },
            description: 'Gets the panel with the given id.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/panel/{workspaceId}',
        config: {
            handler: panel.createPanel,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                },
                payload: {
                    name: Joi.string().required(),
                    type: Joi.number().required(),
                    providerAccounts: Joi.array().includes(Joi.string())
                }
            },
            description: 'Creates a new panel in the given workspaceId.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'DELETE',
        path: '/panel/{workspaceId}/{panelId}',
        config: {
            handler: panel.deletePanel,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required(),
                    panelId: Joi.string().required()
                }
            },
            description: 'Deletes the panel with the given id.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/panel/{workspaceId}/{panelId}/add_provider_account',
        config: {
            handler: panel.addProviderAccount,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required(),
                    panelId: Joi.string().required()
                },
                payload: {
                    providerAccountId: Joi.string().required()
                }
            },
            description: 'Adds a providerAccount to the given panel.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'DELETE',
        path: '/panel/{workspaceId}/{panelId}/remove_provider_account',
        config: {
            handler: panel.removeProviderAccount,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required(),
                    panelId: Joi.string().required()
                },
                payload: {
                    providerAccountId: Joi.string().required()
                }
            },
            description: 'Removes a providerAccount from the given panel.',
            notes: 'USER role required',
            tags: ['api']
        }
    }
];

module.exports.routes = function (server) {
    server.route(routes);
};
