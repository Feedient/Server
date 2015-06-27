var sockjs       = require('sockjs');
var UserSession  = require('../entities/userSession');
var fs           = require('fs');
var msgFormatter = require('./msgFormatter');
var async        = require('async');
var Stream	     = require('../services/stream');

// Number of connected clients to the sockets.
var connectedClients = 0; // Standard 1 to keep the count right

function Socket(server) {
    this._server = server;
    this._connectedClients = 0;
};

/**
 * Start the socketListener
 */
Socket.prototype.start = function() {
    var self = this;
    var echo = sockjs.createServer();

    // New connection received
    echo.on('connection', function(conn) {
        self._handleConnection(conn);
    });

    echo.installHandlers(self._server.listener, { prefix: '/echo' });
};

/**
 * Handle an incoming connection
 * @param {object} conn
 */
Socket.prototype._handleConnection = function(conn) {
    var self = this;
    var _authenticatedUser = null; // User for THIS connection!

    // Add a connected client.
    this.connectedClients++;

    // Handle message
    conn.on('data', function(message) {
        var self = this;
        var receivedData;

        // // Our user, is null if not authenticated, scope is within connection or it will be for all users!
        // var authenticatedUser = null;
        try {
            receivedData = JSON.parse(message);
        } catch (e) {
            return conn.write(e.message);
        }

        // Check if we got the correct structure of a message being received
        if (!receivedData.type || !receivedData.message) {
            var errorMsg = JSON.stringify({ "error": { "message" : "Invalid message structure!" }});
            return conn.write(errorMsg);
        }

        // if we are not authenticated, handleAuthenticate
        if (!_authenticatedUser) {
            return _handleAuthenticate(conn, receivedData.message, function(err, user) {
                if (err) return conn.write(JSON.stringify({ "error": { "message": err }}));

                // Set the authenticatedUser
                _authenticatedUser = user;

                // Start the streams
                _loadStreams(conn, _authenticatedUser, function(err) {
                    if (err) return conn.write({ "error": { "message": err }});
                    return conn.write(JSON.stringify({ "success": true }));
                });
            });
        } else {
            _loadStreams(conn, _authenticatedUser, function(err) {
                if (err) return conn.write({ "error": { "message": err }});
                return conn.write(JSON.stringify({ "success": true }));
            });
        }
    });

    // Handle close
    conn.on('close', function() {
        this.connectedClients--;
    });
};

/**
 * Handle the authentication, means validating user token and assigning the user object
 * @param conn
 * @param parsedMessage
 * @param callback
 * @returns {string}
 * @private
 */
var _handleAuthenticate = function(conn, parsedMessage, callback) {
    if (!parsedMessage.token) return "Could not authenticate, no user token.";

    UserSession.validateUserToken(parsedMessage.token, function(err, user) {
        if (err) return callback(err);
        if (!user) return callback('errors.SOCKET_NO_USER_FOUND');

        return callback(null, user);
    });
};

/**
 * For every userProvider, getFeed and return if new posts, then loop every x seconds
 * @param conn
 * @param callback
 * @private
 */
var _loadStreams = function(conn, authenticatedUser, callback) {
    authenticatedUser.getUserProviders(function (err, userProviders) {
        if (err) return callback(err);

        var streamService = new Stream();

        // Go through the user providers and create a stream
        async.each(userProviders, function(userProvider, asyncCallback) {
            streamService.getStream(conn, authenticatedUser, userProvider);
            return asyncCallback();
        }, function(err) {
            if (err) return callback(err);
            return callback();
        });
    });
};

module.exports = Socket;
