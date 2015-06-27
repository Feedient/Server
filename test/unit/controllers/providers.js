// // Libraries
// var mongoose                = require('mongoose');
// var should                  = require('should');
// var request                 = require('supertest');
// var async                   = require('async');
// var Joi                     = require('joi');
// var jsondiffpatch 		    = require('jsondiffpatch')
//
// // Feedient
// var config                  = require('../../../config/app');
// var mocks                   = require('../../utils/mocks/index');
//
// // Fixtures
// var fixtureManager          = require('../../utils/fixtureManager');
// var userProvidersFixture    = fixtureManager.getFixture("userproviders");
// var userSessionsFixture     = fixtureManager.getFixture("usersessions");
// var usersFixture            = fixtureManager.getFixture("users");
//
// var UserModel               = require('../../../src/entities/user');
//
// var ProvidersAPI            = require('../../../src/controllers/providers');
// var postSchema              = require('../../../src/schemas/providerPost');
// var postsResultLength30     = require('../../utils/json/controllers/providers/getFeedsLength30.json');
// var postsResultLength20     = require('../../utils/json/controllers/providers/getFeedsLength20.json');
// var postsSince              = require('../../utils/json/controllers/providers/getNewerPosts.json');
//
// /**
// * API Server Configuration
// */
// var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
// var db, user;
//
// // Options for the SJON comparator
// var jsondiffpatchOptions = {
//     objectHash: function(obj) {
//         return obj._id || obj.id || obj.name || true;
//     },
//     arrays: {
//         // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
//         detectMove: true,
//         // default false, the value of items moved is not included in deltas
//         includeValueOnMove: false
//     },
//     textDiff: {
//         // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
//         minLength: 60
//     }
// };
//
// describe('Providers Controller Test', function() {
//     before(function (done) {
//         mongoose.connect(config.database.api_server.url, function (err) {
//             db = mongoose.connection;
//             done();
//         });
//     });
//
//     beforeEach(function (done) {
//         // Clear database
//         fixtureManager.clearData(db, function (err) {
//             // Init database
//             fixtureManager.initData(db, function (err) {
//                 // Load the user
//                 UserModel.findOne({ _id: usersFixture.data[1]._id }, function(err, foundUser) {
//                     user = foundUser;
//                     done();
//                 });
//             });
//         });
//     });
//
//     describe('calling getNewerPosts', function() {
//         it ('should return newer posts for the given user providers and the given ids', function(done) {
//             var json = [
//                 {
//                     providerId: userProvidersFixture.data[3]._id.toString(), // Twitter
//                     since: "472024592957964299"
//                 },
//                 {
//                     providerId: userProvidersFixture.data[4]._id.toString(), // Facebook
//                     since: "2014-06-03T12:39:25+0000"
//                 },
//             ];
//
//             var request = {
//                 auth: {
//                     credentials: user
//                 },
//                 payload: {
//                     objects: json
//                 }
//             };
//
//             ProvidersAPI.getNewerPosts(request, function(reply) {
//                 async.each(reply, function (post, callback) {
//                     Joi.validate(post, postSchema, function(err, value) {
//                         if (err) return callback(err);
//                         return callback();
//                     });
//                 }, function (err) {
//                     should.not.exist(err);
//                     var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);
//
//                     // Fix the dates
//                     var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
//                     var postsSinceResult = JSON.parse(JSON.stringify(postsSince), jsondiffpatch.dateReviver);
//
//                     // Diff the jsons
//                     var delta = diffpatcher.diff(result, postsSinceResult);
//                     jsondiffpatch.console.log(delta);
//                     should(delta).not.be.ok;
//                     done();
//                 });
//             });
//         });
//     });
//
//     describe('calling getFeeds', function () {
//         it('Should get the feeds for the given user providers with length 30 if length is set on 30', function (done) {
//             var request = {
//                 auth: {
//                     credentials: user
//                 },
//                 payload: {
//                     providers: [
//                         userProvidersFixture.data[0]._id.toString(),
//                         userProvidersFixture.data[1]._id.toString(),
//                         userProvidersFixture.data[2]._id.toString(),
//                         userProvidersFixture.data[3]._id.toString(),
//                         userProvidersFixture.data[4]._id.toString()
//                     ],
//                     amount: 30
//                 }
//             };
//
//             ProvidersAPI.getFeeds(request, function (reply) {
//                 reply.posts.length.should.within(0, request.payload.amount);
//                 async.each(reply, function (post, callback) {
//                     Joi.validate(post, postSchema, function(err, value) {
//                         if (err) return callback(err);
//                         return callback();
//                     });
//                 }, function (err) {
//                     should.not.exist(err);
//                     var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);
//
//                     // Fix the dates
//                     var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
//
//                     // Check pagination exists
//                     result.pagination.should.containEql({ providerId: request.payload.providers[0], since: '730220172576691726_348759228', until: "730220172576691726_348759228" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[1], since: '1401224557', until: "1401224557" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[2], since: 'Wed May 28 2014 07:24:42 GMT+0000 (UTC)', until: "Wed May 28 2014 07:24:42 GMT+0000 (UTC)" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[3], since: '472024592957964289', until: "472024592957964289" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[4], since: '1402303968', until: "1401916339" });
//
//                     var postsResultLength30Result = JSON.parse(JSON.stringify(postsResultLength30), jsondiffpatch.dateReviver);
//
//                     // Diff the jsons
//                     var delta = diffpatcher.diff(result, postsResultLength30Result);
//                     jsondiffpatch.console.log(delta);
//                     should(delta).not.be.ok;
//                     done();
//                 });
//             });
//         });
//
//         it('Should get the feeds for the given user providers with length 20 if length is set on 20', function (done) {
//             var request = {
//                 auth: {
//                     credentials: user
//                 },
//                 payload: {
//                     providers: [
//                         userProvidersFixture.data[0]._id.toString(),
//                         userProvidersFixture.data[1]._id.toString(),
//                         userProvidersFixture.data[2]._id.toString(),
//                         userProvidersFixture.data[3]._id.toString(),
//                         userProvidersFixture.data[4]._id.toString()
//                     ],
//                     amount: 20
//                 }
//             };
//
//             ProvidersAPI.getFeeds(request, function (reply) {
//                 reply.posts.length.should.within(0, request.payload.amount);
//                 async.each(reply, function (post, callback) {
//                     Joi.validate(post, postSchema, function(err, value) {
//                         if (err) return callback(err);
//                         return callback();
//                     });
//                 }, function (err) {
//                     should.not.exist(err);
//                     var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);
//
//                     // Fix the dates
//                     var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
//
//                     // Check pagination exists
//                     result.pagination.should.containEql({ providerId: request.payload.providers[0], since: '730220172576691726_348759228', until: "730220172576691726_348759228" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[1], since: '1401224557', until: "1401224557" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[2], since: 'Wed May 28 2014 07:24:42 GMT+0000 (UTC)', until: "Wed May 28 2014 07:24:42 GMT+0000 (UTC)" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[3], since: '472024592957964289', until: "472024592957964289" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[4], since: '1402303968', until: "1401916339" });
//
//                     // Remove pagination, async gets random
//                     // result.pagination = [];
//                     // postsResultLength20.pagination = [];
//                     var postsResultLength20Result = JSON.parse(JSON.stringify(postsResultLength20), jsondiffpatch.dateReviver);
//
//                     // Diff the jsons
//                     var delta = diffpatcher.diff(result, postsResultLength20Result);
//                     jsondiffpatch.console.log(delta);
//                     should(delta).not.be.ok;
//                     done();
//                 });
//             });
//         });
//
//         it('Should get the feeds for the given user providers with length 30 if length is NOT set', function (done) {
//             var request = {
//                 auth: {
//                     credentials: user
//                 },
//                 payload: {
//                     providers: [
//                         userProvidersFixture.data[0]._id.toString(),
//                         userProvidersFixture.data[1]._id.toString(),
//                         userProvidersFixture.data[2]._id.toString(),
//                         userProvidersFixture.data[3]._id.toString(),
//                         userProvidersFixture.data[4]._id.toString()
//                     ]
//                 }
//             };
//
//             ProvidersAPI.getFeeds(request, function (reply) {
//                 reply.posts.length.should.within(0, 30);
//                 async.each(reply, function (post, callback) {
//                     Joi.validate(post, postSchema, function(err, value) {
//                         if (err) return callback(err);
//                         return callback();
//                     });
//                 }, function (err) {
//                     should.not.exist(err);
//                     var diffpatcher = jsondiffpatch.create(jsondiffpatchOptions);
//
//                     // Fix the dates
//                     var result = JSON.parse(JSON.stringify(reply), jsondiffpatch.dateReviver);
//
//                     // Check pagination exists
//                     result.pagination.should.containEql({ providerId: request.payload.providers[0], since: '730220172576691726_348759228', until: "730220172576691726_348759228" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[1], since: '1401224557', until: "1401224557" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[2], since: 'Wed May 28 2014 07:24:42 GMT+0000 (UTC)', until: "Wed May 28 2014 07:24:42 GMT+0000 (UTC)" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[3], since: '472024592957964289', until: "472024592957964289" });
//                     result.pagination.should.containEql({ providerId: request.payload.providers[4], since: '1402303968', until: "1401916339" });
//
//                     // Remove pagination keys from json, this because we go async processes
//                     result.pagination = {};
//                     postsResultLength30.pagination = {};
//
//                     var postsResultLength30Result = JSON.parse(JSON.stringify(postsResultLength30), jsondiffpatch.dateReviver);
//
//                     // Diff the jsons
//                     var delta = diffpatcher.diff(result, postsResultLength30Result);
//                     jsondiffpatch.console.log(delta);
//                     should(delta).not.be.ok;
//                     done();
//                 });
//             });
//         });
//     });
//
//     after(function (done) {
//         // Clear database
//         fixtureManager.clearData(db, function () {
//             done();
//         });
//     });
// });
