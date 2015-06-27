'use strict';

var UserSession  = require('../entities/userSession');
var msgFormatter = require('../lib/msgFormatter');

module.exports = function (token, callback) {
    // Validate the user token
    UserSession.validateUserToken(token, function(err, user) {
        if (err) return callback(err);
        if (!user) return callback('errors.UNAUTHORIZED');
        
        return callback(null, user);
    });
};