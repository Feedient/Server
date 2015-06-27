//var should      = require('should');
//var server      = require('../../server');
//var Hapi        = require('hapi');
//var config      = require('../../config/app');
//
//describe('FeedientMongoose Plugin', function () {
//    before(function (done) {
//        this.server = new Hapi.Server();
//        done();
//    });
//
//    it('Should be able to register the plugin', function (done) {
//        this.server.pack.require('../../src/plugins/FeedientMongoose', config.database.api_server, done);
//    });
//
//    it('Should be able to find the plugin exposed objects', function (done) {
//        var server = this.server;
//        server.inject({ method: 'GET', url: '/' }, function() {});
//        server.route({ method: 'GET', path: '/', handler: function() {
//            server.plugins['FeedientMongoose'].db.should.not.equal(undefined);
//            done();
//        }});
//    });
//});