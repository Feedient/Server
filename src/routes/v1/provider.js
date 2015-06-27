'use strict';

var Joi	        = require('joi');
var provider    = require('../../controllers/provider');

var routes = [
	{
        method: 'GET',
        path: '/provider',
        config: {
            handler: provider.getProviders,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
			description: 'Gets the providers for the current user.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
	{
        method: 'GET',
        path: '/provider/{id}',
        config: {
            handler: provider.getProvider,
            auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				params: {
					id: Joi.string().required()
				}
			},
			cache: {
				privacy: 'private',
				expiresIn: 60 * 60 * 1000 // ExpireTime = 1h
			},
			description: 'Gets the provider with the given id.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
	{
        method: 'DELETE',
        path: '/provider/{id}',
        config: {
            handler: provider.deleteProvider,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    id: Joi.string().required()
                }
            },
			description: 'Deletes the provider with the given id.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
	{
        method: 'PUT',
        path: '/provider/{id}',
        config: {
            handler: provider.updateProvider,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    id: Joi.string().required()
                }
            },
			description: 'Updates the provider with the given id.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
	{
        method: 'GET',
        path: '/provider/{name}/request_token',
        config: {
            handler: provider.getRequestToken,
            validate: {
                params: {
                    name: Joi.string().required()
                }
            },
			description: 'Get the requestToken for providers with the OAuth1 authentication.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
	{
        method: 'POST',
        path: '/provider/{name}/callback',
        config: {
            handler: provider.createProvider,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                params: {
                    name: Joi.string().required()
                }
            },
			description: 'The callback for the OAuth providers, this adds the account.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/provider/{userProviderId}/post/{postId}',
        config: {
            handler: provider.getPost,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
			cache: {
				privacy: 'private',
				expiresIn: 2 * 60 * 1000 // ExpireTime = 2 minutes
			},
            validate: {
                params: {
                    userProviderId: Joi.string().required(),
                    postId:  Joi.string().required()
                }
            },
			description: 'Gets the given post from the given provider.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/provider/{userProviderId}/{postId}/comments',
        config: {
            handler: provider.getPostComments,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
			cache: {
				privacy: 'private',
				expiresIn: 90 * 1000 // ExpireTime = 90 seconds (Poll time)
			},
            validate: {
                params: {
                    userProviderId: Joi.string().required(),
                    postId: Joi.string().required()
                }
            },
			description: 'Gets the comments for the given post from the given provider.',
			notes: 'USER role required',
			tags: ['api']
        }
    },
	{
		method: 'POST',
		path: '/provider/{userProviderId}/action/{actionMethod}',
		config: {
			handler: provider.doAction,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				params: {
					userProviderId: Joi.string().required(),
					actionMethod: Joi.string().required()
				}
			},
			description: 'Executes the action for the given provider.',
			notes: 'USER role required',
			tags: ['api']
		}
	},

	// DEPRECATED
	{
		method: 'GET',
		path: '/provider/{userProviderId}/notifications',
		config: {
			handler: provider.getNotifications,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				params: {
					userProviderId: Joi.string().required()
				}
			},
			description: 'Gets the notifications for the given userProviderId.',
			notes: 'USER role required',
			tags: ['api']
		}
	},
	{
		method: 'GET',
		path: '/provider/{userProviderId}/{postId}',
		config: {
			handler: provider.getPost,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			cache: {
				privacy: 'private',
				expiresIn: 2 * 60 * 1000 // ExpireTime = 2 minutes
			},
			validate: {
				params: {
					userProviderId: Joi.string().required(),
					postId:  Joi.string().required()
				}
			},
			description: 'Gets the given post from the given provider.',
			notes: 'USER role required',
			tags: ['api']
		}
	},
	{
		method: 'GET',
		path: '/provider/{userProviderId}/feed/{from}',
		config: {
			handler: provider.getOlderFeed,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			cache: {
				privacy: 'private',
				expiresIn: 2 * 60 * 1000 // ExpireTime = 2 minutes
			},
			validate: {
				params: {
					userProviderId: Joi.string().required(),
					from: Joi.string().required()
				}
			},
			description: 'Gets the feed for the given userProvider starting from the given time.',
			notes: 'USER role required',
			tags: ['api']
		}
	},
	{
		method: 'GET',
		path: '/provider/{userProviderId}/feed',
		config: {
			handler: provider.getFeed,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			cache: {
				privacy: 'private',
				expiresIn: 90000 // ExpireTime = 90seconds (Poll time)
			},
			validate: {
				params: {
					userProviderId: Joi.string().required()
				}
			},
			description: 'Gets the feed for the given userProvider.',
			notes: 'USER role required',
			tags: ['api']
		}
	},
	{
		method: 'GET',
		path: '/provider/{userProviderId}/pages',
		config: {
			handler: provider.getPages,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				params: {
					userProviderId: Joi.string().required()
				}
			},
			description: 'Gets the pages from the given provider',
			notes: 'USER role required',
			tags: ['api']
		}
	}
];

module.exports.routes = function (server) {
    server.route(routes);
};
