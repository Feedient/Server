'use strict';

// CONFIGURATION
var config                  = require('./config/app');

// Uncomment + restart to start a http server on port 5959 for debugging!!
// if (config.server.profiler.enabled) {
//     require('look').start(config.server.profiler.port, config.server.profiler.ip);
// }

// API Server
var server = require('./server.js');

// Workers can share any TCP connection
server.start(function (err) {
    if (!config.server.socket_enabled) {
	    server.server.log(['info'], 'Socket Disabled');
        return;
    }

    // Start socket listener
    server.startSocketListener(function (err) {
        server.server.log(['info'], 'Socket Listener started');
    });
});
