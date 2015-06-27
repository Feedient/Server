// Load modules
var Lab    = require('lab');
var Hapi   = require('Hapi');
var Hoek   = require('Hoek');
var Boom   = require('Boom');
var should = require('should');

var config = require('../../config/app');

// Internals
var internals = {};

// Test objects
var users = {
    'user123': {
        email: 'user@user.be',
        password: 'user',
        token: 'user123',
        role: 'USER'
    },
    'admin123': {
        email: 'admin@admin.be',
        password: 'admin',
        token: 'admin123',
        role: 'ADMIN'
    }
};

describe('FeedientAuthentication', function() {
    it('A GUEST can access a GUEST request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', handler: function (request, reply) { reply('HELLO GUEST!'); } });

        // Invoke the route and check if we do not need any headers
        server.inject('/', function (res) {
            res.statusCode.should.equal(200);
            done();
        });
    });


    it('A GUEST can not access a USER request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', config: { auth: 'feedient', bind: { requiredRole: 'USER' }, handler: function (request, reply) { reply('HELLO USER!'); } } });

        // Invoke the route and check if we do not need any headers
        server.inject('/', function (res) {
	        res.statusCode.should.equal(400);
            done();
        });
    });

    it('An empty Bearer token can not do an authenticated request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', config: { auth: 'feedient', bind: { requiredRole: 'USER' }, handler: function (request, reply) { reply('HELLO USER!'); } } });

        // Invoke the route and check if we do not need any headers
        server.inject({ url: '/', headers: { Bearer: '' }}, function (res) {
	        res.statusCode.should.equal(400);
            done();
        });
    });

    it('A USER can access a GUEST request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', handler: function (request, reply) { reply('HELLO GUEST!'); } });

        // Invoke the route and check if we do not need any headers
        server.inject({ url: '/', headers: { Bearer: 'user123' }}, function (res) {
	        res.statusCode.should.equal(200);
            done();
        });
    });

    it('A USER can access a USER request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', config: { auth: 'feedient', bind: { requiredRole: 'USER' }, handler: function (request, reply) { reply('HELLO USER!'); } } });

        // Invoke the route and check if we do not need any headers
        server.inject({ url: '/', headers: { Bearer: 'user123' }}, function (res) {
	        res.statusCode.should.equal(200);
            done();
        });
    });

    it('A USER cannot access a ADMIN request', function(done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', config: { auth: 'feedient', bind: { requiredRole: 'ADMIN' }, handler: function (request, reply) { reply('HELLO ADMIN!'); } } });

        // Invoke the route and check if we do not need any headers
        server.inject({ url: '/', headers: { Bearer: 'user123' }}, function (res) {
	        res.statusCode.should.equal(401);
            done();
        });
    });

    it('A ADMIN can access a USER request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', config: { auth: 'feedient', bind: { requiredRole: 'USER' }, handler: function (request, reply) { reply('HELLO USER!'); } } });

        // Invoke the route and check if we do not need any headers
        server.inject({ url: '/', headers: { Bearer: 'admin123' }}, function (res) {
	        res.statusCode.should.equal(200);
            done();
        });
    });

    it('A ADMIN can access a ADMIN request', function (done) {
        var server = new Hapi.Server();

        server.auth.scheme('feedient', internals.implementation);
        server.auth.strategy('feedient', 'feedient', { validateFunc: internals.loadUser });

        // Server Routing
        server.route({ method: 'GET', path: '/', config: { auth: 'feedient', bind: { requiredRole: 'ADMIN' }, handler: function (request, reply) { reply('HELLO ADMIN!'); } } });

        // Invoke the route and check if we do not need any headers
        server.inject({ url: '/', headers: { Bearer: 'admin123' }}, function (res) {
	        res.statusCode.should.equal(200);
            done();
        });
    });
});

// Load User
internals.loadUser = function(token, callback) {
    if (!users[token]) {
        return callback(null, false);
    }

    return callback(null, true, users[token]);
};

// Implementation
internals.implementation = function (server, options) {
    var settings = Hoek.clone(options);

    var scheme = {
        authenticate: function (request, reply) {
            var bearerToken = request.headers.bearer;

            if (!bearerToken) {
                return reply(Boom.badRequest('UNAUTHORIZED_TOKEN_INVALID', 'feedient'));
            }

            // Check if the token is valid, get the user back
            settings.validateFunc(bearerToken, function (err, isValid, user) {
                // Check if credentials are valid
                if (err || !isValid || !user) {
                    return reply(Boom.unauthorized('UNAUTHORIZED_TOKEN_INVALID', 'feedient'), { credentials: bearerToken });
                }

                // Check if we got access
                if (!internals.hasAccess(user.role, request.route.bind.requiredRole)) {
                    return reply(Boom.unauthorized('UNAUTHORIZED_NO_ACCESS', 'feedient'), { credentials: bearerToken });
                }

                // Return the user
                return reply(null, { credentials: user });
            });
        }
    };

    return scheme;
};

// Method to check if we got access to this page.
internals.hasAccess = function (userRole, requiredRole) {
    if (!requiredRole || !userRole) {
        return false;
    }

    // Get the config
    requiredRole = config.user.roles[requiredRole.toUpperCase()];
    userRole = config.user.roles[userRole.toUpperCase()];

    // Check if we can access this page
    // 1. Do we got a bigger rank then the required one?
    if (userRole.rank >= requiredRole.rank) {
        return true;
    }

    // 2. Is the required role GUEST?
    if (requiredRole.rank === config.user.roles.GUEST.rank) {
        return true;
    }

    // If nothing returned true return false
    return false;
};