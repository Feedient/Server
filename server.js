'use strict';

// Handle heapdumps, this can be activated by sending a SIGUSR2 signal to the process (kill -USR2 <pid>)
// This will send a snapshot to the cwd
//require('heapdump');

var Hapi                    = require('hapi');
var FeedientAuthentication  = require('./src/plugins/FeedientAuthentication');
var fs                      = require('fs');
var UserSession             = require('./src/entities/userSession');
var http                    = require('http');
var https                   = require("https");

// ROUTES
var V1MiscApi               = require('./src/routes/v1/misc');
var V1ProviderApi           = require('./src/routes/v1/provider');
var V1ProvidersApi          = require('./src/routes/v1/providers');
var V1UserApi               = require('./src/routes/v1/user');
var V1MetricsApi            = require('./src/routes/v1/metrics');
var V1NotificationsApi      = require('./src/routes/v1/notification');
var V1WorkspaceApi          = require('./src/routes/v1/workspace');
var V1PanelApi              = require('./src/routes/v1/panel');
var V1PaymentApi            = require('./src/routes/v1/payments');

// Socket Handler
var Socket                  = require('./src/lib/socket');

// CONFIGURATION
var config                  = require('./config/app');

// Include newrelic on production only
//if (config.server.new_relic_enabled) {
//    require('newrelic');
//}

var serverPort = process.env.NODE_PORT || process.argv[3] || 8000; // Default port is 8000

// Set the max sockets to be open / origin, this gets regulated by the connected sockets
http.globalAgent.maxSockets = Number.MAX_VALUE;
https.globalAgent.maxSockets = Number.MAX_VALUE;

// Create logs directory if it doesn't exists yet
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

// Create server object
var server = new Hapi.Server(config.server.ip, serverPort, {
    cors: {
        origin:  config.server.cors_client_origins,
        headers: config.server.cors_headers,
        methods: config.server.cors_methods,
        credentials: config.server.cors_credentials
    }
});

// Validate Credentials (Used by the FeedientAuthenticate plugin)
var checkUserCredentials = function(token, callback) {
    UserSession.validateUserToken(token, function(err, user) {
        if (err) return callback(err, false);
        if (!user) return callback(null, false);
        return callback(null, true, user);
    });
};

// Starts the API Server
function start(callback) {
    // Load Logger
    server.pack.register([
        {
            plugin: require('./src/plugins/FeedientAuthentication'),
            options: { roles: config.user.roles }
        },
        {
            plugin: require('good'),
            options: {
                opsInterval: 1000,
                reporters: [{
                    reporter: require('good-console'),
                    args:[{ log: '*', request: '*' }]
                }]
            }
        },
        // {
        //     plugin: require('./src/plugins/FeedientMetrics'),
        //     options: config.metrics
        // },
        {
            plugin: require('./src/plugins/FeedientMongoose'),
            options: config.database.api_server
        },
        // {
        //     plugin: require('./src/plugins/FeedientMongodb'),
        //     options: config.database.metrics_server
        // },
        {
            plugin: require('./src/plugins/FeedientI18N-Hapi'),
            options: config.i18n
        }
    ], function(err) {
        if (err) { throw err; }

        // Change default authentication strategy to feedient, also register feedient as a strategy
        server.auth.strategy('default', 'feedient', { checkUserCredentialsFunc: checkUserCredentials });
        server.auth.strategy('feedient', 'feedient', { checkUserCredentialsFunc: checkUserCredentials });

        // Register the documentation generator
        server.pack.register([
            {
                plugin: require('./src/plugins/hapi-swagger'),
                options: config.documentation
            }
        ], function(err) {
            // Configure routes
            V1MiscApi.routes(server);
            V1ProviderApi.routes(server);
            V1ProvidersApi.routes(server);
            V1UserApi.routes(server);
            V1MetricsApi.routes(server);
            V1NotificationsApi.routes(server);
            V1WorkspaceApi.routes(server);
            V1PanelApi.routes(server);
            V1PaymentApi.routes(server);

            // Start the server
            server.start(function() {
                server.log(['info', 'server'], 'Server started on ' + config.server.ip + ':' + serverPort);
                return callback();
            });
        });
    });
};

function stop(timeout, callback) {
    server.stop({ timeout: timeout }, function() {
        return callback();
    });
};

function startSocketListener(callback) {
    var socketService = new Socket(server);
    socketService.start();
    return callback();
};

module.exports = {
    start: start,
    stop: stop,
    startSocketListener: startSocketListener,
    server: server
};
