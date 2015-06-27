'use strict';

var crypto = require('crypto');
var stringGenerator = require('./stringGenerator');

/**
 * Generate a randomized token
 * @param String seed
 * @return String
 */
module.exports = function(seed, callback) {
	var hash = crypto.createHash('sha256');
	hash.update(seed.toString() + new Date().getTime() + stringGenerator(50));
	callback(hash.digest('hex'));
};