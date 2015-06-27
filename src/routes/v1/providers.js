'use strict';

var Joi	          = require('joi');
var providers     = require('../../controllers/providers');

var newFeedSchema = require('../../schemas/providers/getNewerPostsSchema');
var oldFeedSchema = require('../../schemas/providers/getOlderPostsSchema');

var routes = [
	{
		method: 'POST',
		path: '/providers/feed',
		config: {
			handler: providers.getFeeds,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				payload: {
					providers: Joi.array().includes(Joi.string()),
					amount: Joi.number()
				}
			}
		}
	},
	{
		method: 'POST',
		path: '/providers/feed/new',
		config: {
			handler: providers.getNewerPosts,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				payload: {
					objects: newFeedSchema
				}
			}
		}
	},
	{
		method: 'POST',
		path: '/providers/feed/old',
		config: {
			handler: providers.getOlderPosts,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			validate: {
				payload: {
					objects: oldFeedSchema
				}
			}
		}
	},
	{
        method: 'PUT',
        path: '/providers/order',
        config: {
            handler: providers.updateOrder,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                payload: {
                    providerOrder: Joi.string().required()
                }
            }
        }
    },
	{
        method: 'POST',
        path: '/providers/message',
        config: {
            handler: providers.compose,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                payload: {
                    message: Joi.string().required(),
                    providers:  Joi.string().required()
                }
            }
        }
    },
	{
		method: 'POST',
		path: '/providers/pictures',
		config: {
			handler: providers.composeWithPicture,
			auth: 'feedient',
			bind: { requiredRole: 'USER' },
			payload: {
				maxBytes: 10485762, // 10Mb
				output: 'file',
				//parse: false
			},
			validate: {
				payload: {
					message: Joi.string().allow(''),
					providers: Joi.string().required(),
					picture: Joi.object().required()
				}
			}
		}
	}
];

module.exports.routes = function (server) {
    server.route(routes);
};
