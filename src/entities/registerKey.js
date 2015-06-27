'use strict';

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var RegisterKeySchema = new Schema({
	key: { type: String, required: true, index: { unique: true } },
	usages: { type: Number, required: true, default: 1 },
	date_added: { type: Date, required: true, default: Date.now }
});

RegisterKeySchema.statics.handleRegisterKeyOnly = function(cfRegisterKeyOnly, registerKey, callback) {
	if (cfRegisterKeyOnly) {
		if (!registerKey) return callback('errors.REGISTERKEY_EMPTY');

		// Check if it is valid
		this.checkKey(registerKey, function(err, key) {
			if (err) return callback(err);

			// Decrement usages
			key.decUsages(function() {
				return callback(null);
			});
		});
	} else {
		// No register key needed
		callback(null);
	}
};

RegisterKeySchema.statics.checkKey = function(key, callback) {
	this.findOne({ key: key }, function (err, keyObject) {
		if (err) return callback('errors.DATABASE_SELECT_ERROR');
		if (!keyObject) return callback('errors.REGISTERKEY_INVALID');
		if (keyObject.usages == 0) return callback('errors.REGISTERKEY_MAXIMUM_USAGES_REACHED');
		return callback(null, keyObject);
	});
};

RegisterKeySchema.methods.decUsages = function(callback) {
	// Decrement by 1
	var updates = { $inc: { usages: -1 } };

	return this.update(updates, callback);
};

module.exports = mongoose.model('RegisterKey', RegisterKeySchema);