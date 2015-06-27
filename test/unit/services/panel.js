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

// Fixtures
var fixtureManager          = require('../../utils/fixtureManager');
var userProvidersFixture    = require("../../utils/fixtures/userproviders");
var userSessionsFixture     = require("../../utils/fixtures/usersessions");
var usersFixture            = require("../../utils/fixtures/users");
var workspaceFixture        = require("../../utils/fixtures/workspaces");
var panelFixture            = require("../../utils/fixtures/panels");

// Enums
var panelTypeEnum           = require('../../../src/enum/panelType');

// Models
var UserModel               = require('../../../src/entities/user');
var PanelModel              = require('../../../src/entities/panel');

// Services Used
var accountService          = require('../../../src/services/account');
var panelService            = require('../../../src/services/panel');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user, admin;

describe('Panel Service Test', function() {
    before(function(done) {
        fixtureManager.reset(config, done);
    });

    beforeEach(function(done) {
        fixtureManager.seed(config, [
            { name: "users", data: usersFixture },
            { name: "usersessions", data: userSessionsFixture },
            { name: "userproviders", data: userProvidersFixture },
            { name: "workspaces", data: workspaceFixture },
            { name: "panels", data: panelFixture }
        ], function() {
            // Load the user
            UserModel.findOne({ _id: usersFixture[1]._id }, function(err, foundUser) {
                user = foundUser;

                // Load the admin
                UserModel.findOne({ _id: usersFixture[0]._id }, function(err, foundUser) {
                    admin = foundUser;

                    done();
                });
            });
        });
    });

    afterEach(function(done) {
        fixtureManager.reset(config, done);
    });

    after(function(done) {
        fixtureManager.reset(config, done);
    });

    describe('calling createPanel', function () {
        it('should add a panel with given name, type and size 1 by default to the workspace', function (done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel", panelTypeEnum.ANALYTICS, function(err, panel) {
                should.not.exist(err);
                should.exist(panel);
                panel.type.should.equal(panelTypeEnum.ANALYTICS);
                panel.name.should.equal("MyPanel");
                panel.providerAccounts.length.should.equal(0);
                panel.order.should.equal(5);
                panel.size.should.equal(1);

                done();
            });
        });

        it('should add a panel with order equal to 4 when we add a fourth panel', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.ANALYTICS, function(err, panel) {
                panelService.create(user, workspaceFixture[0]._id, "MyPanel2", panelTypeEnum.INBOX, function(err, panel2) {
                    should.exist(panel2);
                    panel2.type.should.equal(panelTypeEnum.INBOX);
                    panel2.name.should.equal("MyPanel2");
                    panel2.providerAccounts.length.should.equal(0);
                    panel2.order.should.equal(6);

                    done();
                });
            });
        });

        it('should add a panel with providerId 1,2,3 if we enter providerIds', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.ANALYTICS, [ 1, 2, 3 ], 2, function(err, panel) {
                should.exist(panel);
                should.not.exist(err);
                panel.type.should.equal(panelTypeEnum.ANALYTICS);
                panel.name.should.equal("MyPanel1");
                panel.providerAccounts.length.should.equal(3);
                panel.providerAccounts.should.containEql(1);
                panel.providerAccounts.should.containEql(2);
                panel.providerAccounts.should.containEql(3);
                panel.order.should.equal(5);
                panel.size.should.equal(2);

                done();
            });
        });

        it('should add a panel with size equal to 3 when we set size equal to 3', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.ANALYTICS, [], 3, function(err, panel) {
                should.not.exist(err);
                should.exist(panel);
                panel.type.should.equal(panelTypeEnum.ANALYTICS);
                panel.name.should.equal("MyPanel1");
                panel.providerAccounts.length.should.equal(0);
                panel.order.should.equal(5);
                panel.size.should.equal(3);

                done();
            });
        });

        it('should return an error if we are not the owner of the workspace', function(done) {
            panelService.create(user, workspaceFixture[1]._id, "MyPanel", panelTypeEnum.ANALYTICS, function(err, panel) {
                should.exist(err);
                err.should.be.equal('errors.WORKSPACE_WRONG_CREATOR');

                done();
            });
        });

        it('should return an error if the workspace doesn\'t exist', function(done) {
            panelService.create(user, 'invalidworks', "MyPanel", panelTypeEnum.ANALYTICS, function(err, panel) {
                should.exist(err);
                err.should.be.equal('errors.WORKSPACE_DOES_NOT_EXIST');

                done();
            });
        });

        it('should return an error if we are adding a panel with a name that we already have', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.ANALYTICS, function(err, panel) {
                panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.INBOX, function(err, panel2) {
                    should.exist(err);
                    err.should.equal('errors.PANEL_NAME_ALREADY_USED');

                    done();
                });
            });
        });

        it('should return an error if we are adding a panel with a non existing panelType value', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", 3, function(err, panel) {
                should.exist(err);
                err.should.equal('errors.PANEL_INCORRECT_TYPE');

                done();
            });
        });

        it('should return an error if we are adding a panel with an empty name', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "", panelTypeEnum.ANALYTICS, function(err, panel) {
                should.exist(err);
                err.should.equal('errors.PANEL_EMPTY_NAME');

                done();
            });
        });
    });

    describe('calling remove', function() {
        it('should return the amount of removed panels', function(done) {
            panelService.remove(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.be.equal(true);

                done();
            });
        });

        it('should return an error if we do not own the workspace of the panel', function(done) {
            panelService.remove(admin, workspaceFixture[0]._id, panelFixture[0]._id, function(err, success) {
                should.exist(err);
                should.not.exist(success);
                err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                done();
            });
        });
    });

    describe('calling getPanelsByWorkspaceId', function() {
        it('should return the 1 panel for that workspaceId if we have 1 panel added', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.ANALYTICS, function(err, panel) {
                panelService.getPanelsByWorkspaceId(user, workspaceFixture[0]._id, function(err, panels) {
                    should.not.exist(err);
                    should.exist(panels);

                    panels.length.should.equal(5);

                    done();
                });
            });
        });

        it('should return the 4 panels for that workspaceId if we have 2 panels added', function(done) {
            panelService.create(user, workspaceFixture[0]._id, "MyPanel1", panelTypeEnum.ANALYTICS, function(err, panel) {
                panelService.create(user, workspaceFixture[0]._id, "MyPanel2", panelTypeEnum.INBOX, function(err, panel) {
                    panelService.getPanelsByWorkspaceId(user, workspaceFixture[0]._id, function(err, panels) {
                        should.not.exist(err);
                        should.exist(panels);

                        panels.length.should.equal(6);

                        done();
                    });
                });
            });
        });

        it('should return an error if we don\'t have access the entered workspace', function(done) {
            panelService.getPanelsByWorkspaceId(user, workspaceFixture[3]._id, function(err, panels) {
                should.not.exist(panels);
                should.exist(err);

                err.should.equal('errors.WORKSPACE_NO_ACCESS');

                done();
            });
        });
    });

    describe('calling getPanelById', function() {
        it('should return the panel object for that id if we are the creator', function(done) {
            panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                should.not.exist(err);
                should.exist(panel);
                panel._id.toString().should.equal(panelFixture[0]._id.toString());
                done();
            });
        });

        it('should return the panel object for that id if we are in the users array', function(done) {
            panelService.getPanelById(user, workspaceFixture[2]._id, panelFixture[3]._id, function(err, panel) {
                should.not.exist(err);
                should.exist(panel);
                panel._id.toString().should.equal(panelFixture[3]._id.toString());
                done();
            });
        });

        it('should return an error if we do not have access to the panel!', function(done) {
            panelService.getPanelById(admin, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                should.exist(err);
                should.not.exist(panel);
                err.should.equal('errors.WORKSPACE_NO_ACCESS');
                done();
            });
        })
    });



    describe('calling updateProviderAccounts', function() {
        it('should return success if no errors', function(done) {
            panelService.updateProviderAccounts(user, workspaceFixture[0]._id, panelFixture[0]._id,  ['1', '2', '3'], function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                    should.not.exist(err);
                    should.exist(panel);

                    panel.providerAccounts.should.have.containDeep(["1", "2", "3"]);

                    done();
                });
            });
        });

        it('should return error if we don\'t own the workspace', function(done) {
            panelService.updateProviderAccounts(admin, workspaceFixture[0]._id, panelFixture[0]._id,  ['1', '2', '3'], function(err, success) {
                should.exist(err);
                should.not.exist(success);

                err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                done();
            });
        });
    });

    describe('calling updateName', function() {
        it('should return success if no errors', function(done) {
            panelService.updateName(user, workspaceFixture[0]._id, panelFixture[0]._id,  "Updated Name", function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                    should.not.exist(err);
                    should.exist(panel);

                    panel.name.should.equal("Updated Name");

                    done();
                });
            });
        });

        it('should return error if we don\'t own the workspace', function(done) {
            panelService.updateName(admin, workspaceFixture[0]._id, panelFixture[0]._id,  "Updated Name", function(err, success) {
                should.exist(err);
                should.not.exist(success);

                err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                done();
            });
        });
    });

    describe('calling updateOrder', function() {
        it('should return success if no errors', function(done) {
            panelService.updateOrder(user, workspaceFixture[0]._id, panelFixture[0]._id,  5, function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                    should.not.exist(err);
                    should.exist(panel);

                    panel.order.should.equal(5);

                    done();
                });
            });
        });

        it('should return error if we don\'t own the workspace', function(done) {
            panelService.updateOrder(admin, workspaceFixture[0]._id, panelFixture[0]._id,  5, function(err, success) {
                should.exist(err);
                should.not.exist(success);

                err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                done();
            });
        });
    });

    describe('calling updateSize', function() {
        it('should return success if no errors', function(done) {
            panelService.updateSize(user, workspaceFixture[0]._id, panelFixture[0]._id, 5, function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                    should.not.exist(err);
                    should.exist(panel);

                    panel.size.should.equal(5);

                    done();
                });
            });
        });
    });

    describe('calling addProviderAccount', function() {
        it('should return success if no errors', function(done) {
            panelService.addProviderAccount(user, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[0]._id, function(err, success) {
                should.not.exist(err);
                should.exist(success);
                success.should.equal(true);

                panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                    should.not.exist(err);
                    should.exist(panel);

                    panel.providerAccounts.indexOf(userProvidersFixture[0]._id).should.be.greaterThan(-1);

                    done();
                });
            });
        });

        it('should return error if we don\'t own the userProvider!', function(done) {
            panelService.addProviderAccount(user, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[5]._id, function(err, success) {
                should.exist(err);
                should.not.exist(success);

                err.should.equal('errors.PANEL_NO_ACCESS_PROVIDER_ACCOUNT');

                done();
            });
        });

        it('should return error if we don\'t own the workspace', function(done) {
            panelService.addProviderAccount(admin, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[0]._id, function(err, success) {
                should.exist(err);
                should.not.exist(success);

                err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                done();
            });
        });
    });

    describe('calling removeProviderAccount', function() {
        it('should return success if no errors', function(done) {
            panelService.addProviderAccount(user, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[0]._id, function(err, success) {
                panelService.removeProviderAccount(user, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[0]._id, function(err, success) {
                    should.not.exist(err);
                    should.exist(success);
                    success.should.equal(true);

                    panelService.getPanelById(user, workspaceFixture[0]._id, panelFixture[0]._id, function(err, panel) {
                        should.not.exist(err);
                        should.exist(panel);

                        panel.providerAccounts.indexOf(userProvidersFixture[0]._id).should.equal(-1);

                        done();
                    });
                });
            });
        });

        it('should return error if we don\'t own the workspace', function(done) {
            panelService.addProviderAccount(user, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[0]._id, function(err, success) {
                should.not.exist(err);

                panelService.removeProviderAccount(admin, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[0]._id, function(err, success) {
                    should.exist(err);
                    should.not.exist(success);

                    err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                    done();
                });
            });
        });

        it('should return error if the providerAccount doesn\'t exist', function(done) {
            panelService.removeProviderAccount(user, workspaceFixture[0]._id, panelFixture[0]._id, userProvidersFixture[5]._id, function(err, success) {
                should.exist(err);
                should.not.exist(success);

                err.should.equal('errors.PANEL_PROVIDER_ACCOUNT_NOT_FOUND');

                done();
            });
        });
    });

    describe('calling getContent', function() {
        it('should return an error if we do not have access to the workspace', function(done) {
            panelService.getContent(admin, workspaceFixture[0]._id, panelFixture[0]._id, function(err, content) {
                should.exist(err);
                should.not.exist(content);
                err.should.equal('errors.WORKSPACE_NO_ACCESS');
                done();
            });
        });

        it('should use the feedAPI when we call the feedPanel', function(done) {
            panelService.getContent(user, workspaceFixture[0]._id, panelFixture[1]._id, function(err, content) {
                should.not.exist(err);
                should.exist(content);
                content.should.be.array;
                done();
            });
        });

        it('should return content or errors.panel.api_not_found for every panelType that we have', function(done) {
            var counter = 0;

            async.each(Object.keys(panelTypeEnum), function(key, callback) {
                counter++;

                panelService.create(user, workspaceFixture[0]._id, "MyPanel" + counter, panelTypeEnum[key], function(err, panel) {
                    should.not.exist(err);
                    should.exist(panel);

                    panelService.getContent(user, workspaceFixture[0]._id, panel._id, function(err, content) {
                        (err === null || err === 'errors.panel.api_not_found').should.be.true;
                        (content === undefined || (Object.prototype.toString.call(content) === '[object Array]')).should.be.true;
                        callback();
                    });
                });
            }, function(err) {
                should.not.exist(err);
                done();
            });
        });
    });

    describe('calling getPanelsAndWorkspaces', function() {
        it('should return the workspaces with the panels for the users', function(done) {
            panelService.getPanelsAndWorkspaces(user, function(err, workspacesAndPanels) {
                should.not.exist(err);
                should.exist(workspacesAndPanels);

                workspacesAndPanels.should.be.instanceof(Array);

                async.each(workspacesAndPanels, function(workspaceAndPanels, callback) {
                    workspaceAndPanels.users.should.exist;
                    workspaceAndPanels.panels.should.exist;

                    workspaceAndPanels.users.should.be.instanceof(Array);
                    workspaceAndPanels.panels.should.be.instanceof(Array);

                    callback();
                }, function(err) {
                    should.not.exist(err);
                    done();
                });
            });
        });
    });
});
