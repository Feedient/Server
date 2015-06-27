'use strict';

// Load Modules
var Boom         = require('boom');
var Hoek         = require('hoek');
var Joi          = require('joi');
var UserSession  = require('../../../entities/userSession');
var msgFormatter = require('../../../lib/msgFormatter');


// Declare vars
var internals = {};
var defaultOptions = {
    roles: {
        "GUEST": {
            "rank": 0,
            "name": "Guest"
        },

        "USER": {
            "rank": 1,
            "name": "User"
        },

        "PREMIUM": {
            "rank": 2,
            "name": "Premium User"
        },

        "ADMIN": {
            "rank": 3,
            "name": "Administrator"
        }
    }
};

// Plugin registration
exports.register = function (plugin, options, next) {
    internals.options = options || defaultOptions;
    plugin.auth.scheme('feedient', internals.implementation);
    return next();
};

exports.register.attributes = {
    name: 'FeedientAuthentication',
    version: '1.0.0'
};

// Implementation
internals.implementation = function (server, options) {
    // Check settings against schema
    Hoek.assert(options, 'Invalid FeedientAuthentication scheme options');
    Hoek.assert(options.checkUserCredentialsFunc, 'Missing required checkUserCredentialsFunc method in feedient scheme configuration.');

    // Clone the settings
    var settings = Hoek.clone(options);

    // Authentication schema
    var scheme = {
        authenticate: function (request, reply) {
            var bearerToken = request.headers.bearer;

            if (!bearerToken) {
                return reply(Boom.badRequest(msgFormatter.getMessage('UNAUTHORIZED_TOKEN_INVALID'), 'feedient'));
            }

            // Check if the token is valid, get the user back
            settings.checkUserCredentialsFunc(bearerToken, function (err, isValid, user) {
                // Check if credentials are valid
                if (err || !isValid || !user) {
                    return reply(Boom.unauthorized(msgFormatter.getMessage('UNAUTHORIZED_TOKEN_INVALID'), 'feedient'), { credentials: bearerToken });
                }

                // Check if we got access
                if (!internals.hasAccess(user.role, request.route.bind.requiredRole)) {
                    return reply(Boom.unauthorized(msgFormatter.getMessage('UNAUTHORIZED_NO_ACCESS'), 'feedient'), { credentials: bearerToken });
                }

                // Return the user
                return reply(null, { credentials: user });
            });
        }
    };

    return scheme;
};

// Options schema
internals.schema = Joi.object({
    roles: Joi.object()
});

// Method to check if we got access to this page.
internals.hasAccess = function (userRole, requiredRole) {
    if (!requiredRole || !userRole) {
        return false;
    }

    // Get the config
    requiredRole = internals.options.roles[requiredRole.toUpperCase()];
    userRole = internals.options.roles[userRole.toUpperCase()];

    // Check if we can access this page
    // 1. Do we got a bigger rank then the required one?
    if (userRole.rank >= requiredRole.rank) {
        return true;
    }

    // 2. Is the required role GUEST?
    if (requiredRole.rank === internals.options.roles.GUEST.rank) {
        return true;
    }

    // If nothing returned true return false
    return false;
};
