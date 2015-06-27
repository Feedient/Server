'use strict';

var Joi		= require('joi');
var payment = require('../../controllers/payment');
var routes  = require('../../controllers/routes');

var routes = [
    {
        method: 'POST',
        path: '/payment/remove_ads/one_month',
        config: {
            handler: payment.payRemoveAdsOneMonth,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Charges the user to remove ads.',
            notes: 'authentication required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/payment/remove_ads/three_months',
        config: {
            handler: payment.payRemoveAdsForThreeMonths,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Charges the user to remove ads.',
            notes: 'authentication required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/payment/remove_ads/six_months',
        config: {
            handler: payment.payRemoveAdsForSixMonths,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Charges the user to remove ads.',
            notes: 'authentication required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/payment/remove_ads/lifetime',
        config: {
            handler: payment.payRemoveAdsForLifetime,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Charges the user to remove ads.',
            notes: 'authentication required',
            tags: ['api']
        }
    }
];

module.exports.routes = function (server) {
    server.route(routes);
};
