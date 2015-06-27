'use strict';

var Joi	 = require('joi');
var notification    = require('../../controllers/notification');

var routes = [
    {
        method: 'POST',
        path: '/notification',
        config: {
            handler: notification.insertNotifications,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            validate: {
                payload: {
                    providerId: Joi.string().required(),
                    notifications: Joi.array().required()
                }
            },
            description: 'Inserts the notifications for the providerId into the database, this too avoid showing them double.',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/notification/{providerId}',
        config: {
            handler: notification.getNotificationsByProviderId,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Gets the notifications for the given providerId',
            notes: 'USER role required',
            tags: ['api']
        }
    }
];

module.exports.routes = function (server) {
    server.route(routes);
};
