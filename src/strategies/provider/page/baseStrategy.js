'use strict';

function BaseStrategy() {

};

/**
 * Gets the user his/her pages that he/she got access too
 */
BaseStrategy.prototype.getPages = function(userProvider, callback) {
    return callback(null, []);
};

BaseStrategy.prototype.processPage = function(page, userProvider) {
    return {};
};

module.exports = BaseStrategy;
