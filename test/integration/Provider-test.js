// Libraries
var mongoose                = require('mongoose');
var should                  = require('should');
var request                 = require('supertest');
var async                   = require('async');
var Joi                     = require('joi');

// Feedient Modules
var server                  = require('../../server');
var config                  = require('../../config/app');
var mocks                   = require('../utils/mocks');

// Fixtures
var fixtureManager          = require('../utils/fixtureManager');
var userProvidersFixture    = fixtureManager.getFixture("userproviders");
var userSessionsFixture     = fixtureManager.getFixture("usersessions");

var providerSchema          = require('../utils/schemas/providerPost');

/**
 * API Server Configuration
 */
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db;


before(function(done) {
	mongoose.connect(config.database.api_server.url, function (err) {
		db = mongoose.connection;
		done();
	});
});

beforeEach(function(done) {
	// Clear database
	fixtureManager.clearData(db, function(err) {
		// Init database
		fixtureManager.initData(db, function(err) {
			done();
		});
	});
});

describe('[GET /provider/:providerId/feed', function() {
	it('should get the Facebook feed', function (done) {
		var accessToken = userSessionsFixture.data[1]['token'];
		var providerId = userProvidersFixture.data[4]['_id'];

        request(api_url)
            .get('/provider/' + providerId + '/feed')
            .set('Bearer', accessToken)
            .set('Content-Type', 'application/json; charset=utf-8')
            .end(function (err, res) {
                if (err) throw err;
                res.should.have.status(200);
		        res.body.should.have.keys([ 'posts', 'provider' ]);
		        res.body.posts.should.be.array;

		        async.each(res.body.posts, function(post, callback) {
			        var err = Joi.validate(post, providerSchema);  // err === null -> valid
					if (err) return callback(err);
			        return callback();
		        }, function(err) {
			        (err == null).should.be.true;
			        done();
		        });
            });
	});
});

after(function(done) {
	// Clear database
	fixtureManager.clearData(db, function() {
		done();
	});
});