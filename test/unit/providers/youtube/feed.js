// Libraries
var mongoose                = require('mongoose');
var should                  = require('should');
var request                 = require('supertest');
var async                   = require('async');
var Joi                     = require('joi');
var jsondiffpatch 		    = require('jsondiffpatch')

// Feedient
var config                  = require('../../../../config/app');
var mocks                   = require('../../../utils/mocks/index');

// Fixtures
var userProvidersFixture    = require("../../../utils/fixtures/userproviders");

var providerSchema          = require('../../../../src/schemas/providerPost');
var pictureEntitySchema     = require('../../../../src/schemas/entities/picture');
var ProvidersAPI         	= require('../../../../src/strategies/providers');
var postsResult 			= require('../../../utils/json/youtube/feedient_response/posts.json');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db;

// Options for the SJON comparator
var jsondiffpatchOptions = {
	objectHash: function(obj) {
		return obj._id || obj.id || obj.name || true;
	},
	arrays: {
		// default true, detect items moved inside the array (otherwise they will be registered as remove+add)
		detectMove: true,
		// default false, the value of items moved is not included in deltas
		includeValueOnMove: false
	},
	textDiff: {
		// default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
		minLength: 60
	}
};

describe('YouTube Feed Test', function() {
	describe('calling getFeed', function () {
		it('should get the feed', function (done) {
			var userProvider = userProvidersFixture[2];
			var timeSince = null;
			var timeUntil = null;
			var limit = 30;

			ProvidersAPI.getFeedAPI(userProvider.providerName).getFeed(userProvider, timeSince, timeUntil, limit, function (err, result) {
				// Validate the whole result
				async.each(result, function (post, callback) {
					async.parallel([
						// Check if the result is what we wanted
						function(asyncParallelCallback) {
							Joi.validate(post, providerSchema, function(err, value) {
								should.not.exist(err);
								return asyncParallelCallback();
							})
						},
						// Validate the picture entity
						function(asyncParallelCallback) {
							async.each(post.content.entities.pictures, function(pictureEntity, entityCallback) {
								Joi.validate(pictureEntity, pictureEntitySchema, function(err, value) {
									should.not.exist(err);
									return entityCallback();
								});
							}, function() {
								return asyncParallelCallback();
							})
						}
					], function() {
						return callback();
					});
				}, function (err) {
					should.not.exist(err);
					var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);

					// Fix the dates
					result = JSON.parse(JSON.stringify(result), jsondiffpatch.dateReviver);
					postsResult = JSON.parse(JSON.stringify(postsResult), jsondiffpatch.dateReviver);

					// Diff the jsons
					var delta = diffpatcher.diff(result, postsResult);
					jsondiffpatch.console.log(delta);
					should(delta).not.be.ok;

					done();
				});
			});
		});
	});
});
