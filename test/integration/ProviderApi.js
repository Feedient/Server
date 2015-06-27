/**
 * Includes
 */
var server      = require('../../server');
var should      = require('should');
var request     = require('supertest');
var port        = 8000;

var fixtureManager = require('../utils/fixtureManager');

var db;
    
/**
 * BDD Description
 * 
 * Describe [GET /provider] getProviders
 *   - it should return the providers for user X
 */
describe('Provider API', function() {
    before(function(done) {
        // Start Server
        server.start(port, function (err) {
            db = server.server.plugins['FeedientMongoDB'].db;
            done();
        });
    });
    
    beforeEach(function(done) {
        // Clear database
        fixtureManager.clearData(db, function() {
            // Init database
            fixtureManager.initData(db, function() {
                done(); 
            });
        });    
    });
    
    describe('[GET /provider] Get providers', function() { 
        it('test', function(done) {
            done();    
        });
    });

	after(function(done) {
		server.stop(0, function() {
			// Clear database
			fixtureManager.clearData(db, function() {
				done();
			});
		});
	});
});