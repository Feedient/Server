'use strict';

var Joi		= require('joi');
var metrics = require('../../controllers/metrics');

var routes = [
    {
        method: 'GET',
        path: '/metrics/{collection}',
        config: {
            handler: metrics.getMetrics,
            auth: 'feedient',
            bind: { requiredRole: 'ADMIN' },
            validate: {
                query: {
                    start_time: Joi.string().required(),
                    end_time: Joi.string(),
                    interval: Joi.number().min(0).max(1000000000) // 0 = epoch start, 10000000000 = Sat 20 Nov 2286
                }
            },
            description: 'Gets the metrics for a specified collection',
            notes: 'ADMIN role required',
            tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/metrics/last/{collection}',
        config: {
            handler: metrics.getLast,
            auth: 'feedient',
            bind: { requiredRole: 'ADMIN' },
            description: 'Gets the last metric in a collection',
            notes: 'ADMIN role required',
            tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/metrics/count/f/{collection}/{conditions?}',
        config: {
            handler: metrics.getCountFeeds,
            auth: 'feedient',
            bind: { requiredRole: 'ADMIN' },
            description: 'Get count for a specified collection with conditions (conditions is optional)',
            notes: 'ADMIN role required',
            tags: ['api']
        }
    },
    {
        method: 'GET',
        path: '/metrics/count/m/{collection}/{conditions?}',
        config: {
            handler: metrics.getCountMetrics,
            auth: 'feedient',
            bind: { requiredRole: 'ADMIN' },
            description: 'Gets the count for the specified collection.',
            notes: 'ADMIN role required',
            tags: ['api']
        }
    },

    // KPI Routes
];

module.exports.routes = function (server) {
    server.route(routes);
};
