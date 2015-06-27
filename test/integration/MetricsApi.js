/**
 * Includes
 */
var fixtureManager      = require('../utils/fixtureManager');
var userSessionFixture  = require('../utils/fixtures/usersessions');
var server              = require('../../server');
var should              = require('should');
var request             = require('supertest');

/**
 * Configuration
 */
var port                = 8000;
var api_url             = 'http://127.0.0.1:' + port;
var adminUserSession    = userSessionFixture.data[0].token;
var db;

    
/**
 * BDD Description
 * 
 * Describe [GET /metrics/{collection}] Metrics Getting
 *   - it should 
 */
describe('User API', function() {
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
    
    describe('[GET /metrics/{collection}] Metrics Getting', function() { 
        it('should return metrics on success', function(done) {
            request(api_url)
                .get('/metrics/users?start_time=1395573670&end_time=1395583687&interval=1000')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', adminUserSession)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.properties([ 'interval' , 'time_start', 'time_end', 'results']);
                    should(res.body.interval).not.equal(null);
                    should(res.body.time_start).not.equal(null);
                    should(res.body.time_end).not.equal(null);
                    done();
                });
        });
        
        it('should return error on missing start_time', function(done) {
            request(api_url)
                .get('/metrics/users?end_time=1395583687&interval=1000')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', adminUserSession)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(400);
                    res.body.should.have.properties([ 'error', 'statusCode', 'message', 'validation' ]);
                    res.body.validation.keys[0].should.equal('start_time');
                    done();
                });
        });
        
        it('should return interval on value 1000 if not supplied', function(done) {
            request(api_url)
                .get('/metrics/users?start_time=1395573670&end_time=1395583687')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', adminUserSession)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.properties([ 'interval' , 'time_start', 'time_end', 'results']);
                    should(res.body.interval).not.equal(null);
                    should(res.body.time_start).not.equal(null);
                    should(res.body.time_end).not.equal(null);
                    res.body.interval.should.equal(1000);
                    done();
                });
        });
        
        it('should return end_time on new Date() if not supplied', function(done) {
            request(api_url)
                .get('/metrics/users?start_time=1395573670')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', adminUserSession)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.properties([ 'interval' , 'time_start', 'time_end', 'results']);
                    should(res.body.interval).not.equal(null);
                    should(res.body.time_start).not.equal(null);
                    should(res.body.time_end).not.equal(null);
                    res.body.interval.should.equal(1000);
                    done();
                });
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