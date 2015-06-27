'use strict';

var Joi	 = require('joi');
var workspace = require('../../controllers/workspace');

var routes = [
    {
        method: 'POST',
        path: '/workspace',
        config: {
            handler: workspace.createWorkspace,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                payload: {
                    name: Joi.string().required()
                }
            },
            description: 'Creates a workspace.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'DELETE',
        path: '/workspace/{workspaceId}',
        config: {
            handler: workspace.deleteWorkspace,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                }
            },
            description: 'Deletes the workspace with the given id.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/workspace/{workspaceId}/add_user',
        config: {
            handler: workspace.addUser,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                },
                payload: {
                    userToAddId: Joi.string().required()
                }
            },
            description: 'Adds the user to the workspace.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'DELETE',
        path: '/workspace/{workspaceId}/remove_user',
        config: {
            handler: workspace.removeUser,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                },
                payload: {
                    userToRemoveId: Joi.string().required()
                }
            },
            description: 'Removes a user from the given workspace.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'PUT',
        path: '/workspace/{workspaceId}',
        config: {
            handler: workspace.updateWorkspace,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    workspaceId: Joi.string().required()
                },
                payload: {
                    name: Joi.string()
                }
            },
            description: 'Updates the workspace with the given id.',
            notes: 'USER role required',
            tags: ['api']
        }
    }
];

module.exports.routes = function (server) {
    server.route(routes);
};
