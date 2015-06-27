/**
 * Includes
 */
var server  = require('../../server');
var should  = require('should');
var request = require('supertest');
var port = 8000;

/**
 * Configuration
 */
var db, user_correct_token;
var api_url                 = 'http://127.0.0.1:' + port;
var fixtureManager          = require('../utils/fixtureManager');
var usersFixture            = require('../utils/fixtures/users');
var userSessionsFixture     = require('../utils/fixtures/usersessions');
var randomNumber            = Math.floor(Math.random() * Date.now());

var register_user_password_too_short = {
    email: 'test123@test.com',
    password: 'test'
};

var register_user_email_wrong = {
    email: 'test123wdawdst.com',
    password: 'tewwwwst'
};

var register_user_email_duplicate = {
    email: usersFixture.data[0].email,
    password: 'tewwwwst'
};

var register_user_correct = {
    email: 'test' + randomNumber + '@test.com',
    password: 'tester' + randomNumber
};

var login_user_correct = {
    email: usersFixture.data[1].email,
    password: 'user123'
};

var login_user_wrong = {
    email: 'wdawd' + randomNumber + '@test.com',
    password: 'teswdawdter' + randomNumber
};

var update_user_password = {
    oldPassword: 'user123',
    password: 'tester' + randomNumber
};

var update_user_password2 = {
    oldPassword: update_user_password.password,
    password: 'user123'
};

var wrong_language = {
    language: 'BlaBla'    
};

var new_language = {
    language: 'en_GB'    
};

var new_email_same_as_old = {
    email: usersFixture.data[1].email
};

var admin_session_token = userSessionsFixture.data[0].token;
var user_session_token  = userSessionsFixture.data[1].token;
    
/**
 * BDD Description
 * 
 * Describe [POST /user] User Registration
 *   While validation the registration info
 *     - it should make sure the email address is valid
 *     - it should make sure the password is longer then 4 characters
 *     - it should verifi the email doesn't already exist
 *   While creating the user's database record
 *     - it should save successfully in the database
 *   While returning a response
 *     - it should return 200 when the user has been created.
 * 
 * Describe [POST /user/authorize] User Authorization
 *   - it should return 200 + the auth token on correct
 *   - it should return 200 + error on wrong bearer token
 * 
 * Describe [GET /user] User Profile
 *   - it should return 200 + _id, email, language
 * 
 * Describe [GET /user/sessions] User Sessions
 *   - it should return 200 + success: true
 * 
 * Describe [PUT /user] User Updating
 *   While updating the password
 *     - it should return 200 on success + success, uid, token
 *     - it should return 200 + error when old password is wrong
 *     - it should be able to login with the new password
 *   While updating the language
 *     - it should return 200 + error when non existing language + properties type (ValidationException) and message
 *     - it should return 200 + success: true on success
 * 
 * Describe [GET /logout] User Logout
 *   - it should show success on logout
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
    
    describe('[POST /user] User Registration', function() {
        describe('While validating the registration info', function() {
            it('should return error on password to short', function(done) {
                request(api_url)
                    .post('/user')
                    .set('Content-Type','application/json')
                    .send(register_user_password_too_short)
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .end(function (err, res) {
                        if (err) throw err;
                        res.should.have.status(400);
                        res.body.should.have.properties([ 'error', 'statusCode', 'message', 'validation' ]);
                        res.body.validation.keys[0].should.equal('password');
                        done();
                    });    
            });

            it('should return error on wrong email format', function(done) {
                 request(api_url)
                    .post('/user')
                    .set('Content-Type','application/json')
                    .send(register_user_email_wrong)
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .end(function (err, res) {
                        if (err) throw err;
                        res.should.have.status(400);
                        res.body.should.have.properties([ 'error', 'statusCode', 'message', 'validation' ]);
                        res.body.validation.keys[0].should.equal('email');
                        done();
                    });       
            });
        });
        
        describe('While returning a response', function() {
            it('should return 200 on creation', function(done) {
                request(api_url)
                    .post('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .send(register_user_correct)
                    .end(function (err, res) {
                        if (err) throw err;
                        res.should.have.status(200);
                        res.body.should.have.property('success');
                        res.body.success.should.equal(true);
                        done();
                    });
            });
        });
        
        describe('While creating a second account', function() {
            it('should return error on duplicate email', function(done) {
                request(api_url)
                    .post('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .send(register_user_email_duplicate)
                    .end(function (err, res) {
                        if (err) throw err;
                        res.should.have.status(200);
                        res.body.should.have.property('error');
                        res.body.error.should.have.properties([ 'type', 'message' ]);
                        done();
                    });
            });
        });
    });
    
    describe('[POST /user/authorize] User Authorization', function() {
        it('it should return 200 + error on wrong credentials', function(done) {
            request(api_url)
                .post('/user/authorize')
                .set('Content-Type', 'application/json; charset=utf-8')
                .send(login_user_wrong)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.property('error');
                    res.body.error.should.have.properties([ 'type', 'message' ]);
                    done();
                });
        });
        
        it('should return 200 + the auth token on correct', function(done) {
            request(api_url)
                .post('/user/authorize')
                .set('Content-Type', 'application/json; charset=utf-8')
                .send(login_user_correct)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.properties([ 'uid', 'token' ]);
                    done();
                });
        });
    });
    
    describe('[GET /user] User Profile', function() {
        it('should return the current logged in user', function(done) {
            request(api_url)
                .get('/user')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', user_session_token)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.properties([ '_id', 'email', 'language' ]);

                    done();
                });        
        });  
    });
    
    describe('[GET /user/sessions] User Sessions', function() {
        it('should return the sessions for the current user', function(done) {
            request(api_url)
                .get('/user/sessions')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', user_session_token)
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.property('sessions');

                    done();
                });        
        });
    });
    
    describe('[PUT /user] User Updating', function() {
        describe('While updating the password', function() {
            it('should change the password + able to change it again', function(done) {
                var temp_token = "";
                
                // First change
                request(api_url)
                    .put('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .set('Bearer', user_session_token)
                    .send(update_user_password)
                    .end(function (err, res) {
                        if (err) throw err;

                        res.should.have.status(200);
                        res.body.should.have.keys('updatePassword');
                        res.body['updatePassword'].should.have.properties([ 'uid', 'token' ]); 
                        
                        temp_token = res.body['updatePassword'].token;

                        // Second change
                        request(api_url)
                            .put('/user')
                            .set('Content-Type', 'application/json; charset=utf-8')
                            .set('Bearer', temp_token)
                            .send(update_user_password2)
                            .end(function (err, res) {
                                if (err) throw err;

                                res.should.have.status(200);
                                res.body.should.have.keys('updatePassword');
                                res.body['updatePassword'].should.have.properties([ 'uid', 'token' ]); 

                                done();
                            });
                    });
            });

            it('should show error on wrong old password', function(done) {
                request(api_url)
                    .put('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .set('Bearer', user_session_token)
                    .send({ oldPassword: ' ', password: ' ' })
                    .end(function (err, res) {
                        if (err) throw err;
                        res.should.have.status(200);
                        res.body.should.have.property('error');
                        res.body.error.should.have.property('type', 'UserException');
                        res.body.error.should.have.property('message');

                        done();
                    });        
            });
        });

        describe('While updating the language', function() {
            it('should show error on non existing language', function(done) {
                request(api_url)
                    .put('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .set('Bearer', user_session_token)
                    .send(wrong_language)
                    .end(function (err, res) {
                        if (err) throw err;

                        res.should.have.status(200);
                        res.body.should.have.property('error');
                        res.body.error.should.have.property('type', 'UserException');
                        res.body.error.should.have.property('message');

                        done();
                    });       
            });

            it('should be able to change the language', function(done) {
                request(api_url)
                    .put('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .set('Bearer', user_session_token)
                    .send(new_language)
                    .end(function (err, res) {
                        if (err) throw err;

                        res.should.have.status(200);
                        res.body.should.have.keys('updateLanguage');
                        res.body['updateLanguage'].should.have.properties([ 'success' ]);

                        done();
                    });       
            });
        });
        
        describe('While updating the email', function() {
            it('should return error if the email is the same as before', function(done) {
                request(api_url)
                    .put('/user')
                    .set('Content-Type', 'application/json; charset=utf-8')
                    .set('Bearer', user_session_token)
                    .send(new_email_same_as_old)
                    .end(function (err, res) {
                        if (err) throw err;

                        res.should.have.status(200);
                        res.body.should.have.property('error');
                        res.body.error.should.have.property('type', 'UserException');
                        res.body.error.should.have.property('message');

                        done();
                    });     
            });    
        });
    });
    
    describe('[DELETE /user/session/{token}] Remove User Sessions', function() {
        it('should remove the given user session', function(done) {
            request(api_url)
                .del('/user/session/' + user_session_token)
                .set('Bearer', user_session_token)
                .set('Content-Type', 'application/json; charset=utf-8')
                .end(function (err, res) {
                    if (err) throw err;
                    res.should.have.status(200);
                    res.body.should.have.property('success');
                    res.body.success.should.equal(true);
                    
                    // Get new user token for the other methods
                    request(api_url)
                        .post('/user/authorize')
                        .set('Content-Type', 'application/json; charset=utf-8')
                        .send(login_user_correct)
                        .end(function (err, res) {
                            if (err) throw err;
                            res.should.have.status(200);
                            res.body.should.have.properties([ 'uid', 'token' ]);

                            done();
                        });
                });       
        });
    });
    
    describe('[GET /logout] User Logout', function() {
        it('should show success on logout', function(done) {
            request(api_url)
                .get('/logout')
                .set('Content-Type', 'application/json; charset=utf-8')
                .set('Bearer', user_session_token)
                .end(function (err, res) {
                    if (err) throw err;

                    res.should.have.status(200);
                    res.body.should.have.property('success');
                    res.body.success.should.equal(true); 

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