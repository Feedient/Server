var defaultEnvironment = 'dev';
var allowedEnvironments = [ 'dev', 'stag', 'prod', 'test' ];

var config;

if ((allowedEnvironments.indexOf(process.argv[2]) == -1) && !process.env.NODE_ENV) {
    config = require(process.cwd() + '/config/app_dev');
} else {
    config = require(process.cwd() + '/config/app_' + (process.env.NODE_ENV || process.argv[2] || defaultEnvironment));
}

module.exports = config;