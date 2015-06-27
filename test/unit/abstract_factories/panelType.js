// Libraries
var mongoose                = require('mongoose');
var should                  = require('should');
var request                 = require('supertest');
var async                   = require('async');
var Joi                     = require('joi');
var jsondiffpatch 		    = require('jsondiffpatch')

// Feedient
var config                  = require('../../../config/app');
var mocks                   = require('../../utils/mocks/index');

// Enums
var panelTypeEnum           = require('../../../src/enum/panelType');

// Abstract factory
var panelTypeAbstractFactory = require('../../../src/abstract_factories/panelType');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user, admin;

describe('PanelType Abstract Factory Test', function() {
    describe('calling getPanelTypeApi', function() {
        it('should return the feedApi if we give the feedApi id with it', function(done) {
            panelTypeAbstractFactory.getPanelTypeApi(panelTypeEnum.FEED, function(err, apiStrategy) {
                should.not.exist(err);
                should.exist(apiStrategy);
                //apiStrategy.should.be.type('function');
                apiStrategy.getName().should.be.equal('feed');
                done();
            });
        });

        it('should return the notificationApi if we give the notificationApi id with it', function(done) {
            panelTypeAbstractFactory.getPanelTypeApi(panelTypeEnum.NOTIFICATION, function(err, apiStrategy) {
                should.not.exist(err);
                should.exist(apiStrategy);
                //apiStrategy.should.be.type('function');
                apiStrategy.getName().should.be.equal('notification');
                done();
            });
        });


        it('should return PANEL_API_NOT_FOUND if we can not find the id', function(done) {
            panelTypeAbstractFactory.getPanelTypeApi(9999999, function(err, apiStrategy) {
                should.exist(err);
                should.not.exist(apiStrategy);
                err.should.equal('errors.panel.api_not_found');
                done();
            });
        });
    });
});
