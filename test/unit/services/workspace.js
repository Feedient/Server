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

// Models
var UserModel               = require('../../../src/entities/user');
var WorkspaceModel          = require('../../../src/entities/workspace');

// Services Used
var accountService          = require('../../../src/services/account');
var workspaceService        = require('../../../src/services/workspace');

/**
* API Server Configuration
*/
var api_url             = 'http://127.0.0.1:' + process.env.NODE_PORT || 8001;
var db, user, admin;

describe('Workspace Service Test', function() {
    before(function(done) {
        fixtureManager.reset(config, done);
    });

    beforeEach(function(done) {
        fixtureManager.seed(config, [
            { name: "users", data: usersFixture },
            { name: "usersessions", data: userSessionsFixture },
            { name: "userproviders", data: userProvidersFixture },
            { name: "workspaces", data: workspaceFixture }
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

    describe('calling getWorksapce', function() {
        it('should return the workspace object if we have access to it', function(done) {
            workspaceService.getWorkspace(user, workspaceFixture[0]._id, function(err, workspace) {
                should.not.exist(err);
                should.exist(workspace);

                workspace.name.should.equal(workspaceFixture[0].name);
                workspace.creator.toString().should.equal(workspaceFixture[0].creator.toString());
                workspace.dateAdded.toString().should.equal(workspaceFixture[0].dateAdded.toString());
                workspace._id.toString().should.equal(workspaceFixture[0]._id.toString());
                workspace.users.toString().should.equal(workspaceFixture[0].users.toString());

                done();
            });
        });

        it('should return an error if we don\'t have access to it', function(done) {
            workspaceService.getWorkspace(user, workspaceFixture[1]._id, function(err, workspace) {
                should.exist(err);
                should.not.exist(workspace);

                err.should.equal('errors.WORKSPACE_NO_ACCESS');

                done();
            });
        });
    });

    describe('calling userOwnsWorkspace', function() {
        it('should return no error if we own the workspace + the object as second parameter', function(done) {
            workspaceService.userOwnsWorkspace(user, workspaceFixture[0]._id, function(err, workspace) {
                should.exist(workspace);
                workspace._id.toString().should.equal(workspaceFixture[0]._id.toString());
                should.not.exist(err);
                done();
            });
        });

        it('should return an error if we don\'t own the workspace', function(done) {
            workspaceService.userOwnsWorkspace(user, workspaceFixture[1]._id, function(err, workspace) {
                should.not.exist(workspace);
                should.exist(err);
                err.should.equal('errors.WORKSPACE_WRONG_CREATOR');
                done();
            });
        });
    });

    describe('calling userHasAccessToWorkspace', function() {
        it('should return the workspace if we own the workspace', function(done) {
            workspaceService.userHasAccessToWorkspace(admin, workspaceFixture[2]._id, function(err, workspace) {
                should.exist(workspace);
                workspace._id.toString().should.equal(workspaceFixture[2]._id.toString());
                should.not.exist(err);
                done();
            });
        });

        it('should return the workspace if we are in the users array', function(done) {
            workspaceService.userHasAccessToWorkspace(user, workspaceFixture[2]._id, function(err, workspace) {
                should.exist(workspace);
                workspace._id.toString().should.equal(workspaceFixture[2]._id.toString());
                should.not.exist(err);
                done();
            });
        });

        it('should return an error if we are not in the users array or not the creator.', function(done) {
            workspaceService.userHasAccessToWorkspace(user, workspaceFixture[3]._id, function(err, workspace) {
                should.exist(err);
                err.should.equal('errors.WORKSPACE_NO_ACCESS');
                done();
            });
        });
    });

    describe('calling createUser', function () {
        it('should add the default workspace : "My Workspace"', function (done) {
            accountService.create('someemail@email.com', 'somePassword', function(err, createdUser) {
                WorkspaceModel.find({ creator: createdUser._id }, function(err, foundWorkspaces) {
                    should.exist(foundWorkspaces);
                    foundWorkspaces.length.should.equal(1);
                    foundWorkspaces[0].name.should.equal('My Workspace');

                    done();
                });
            });
        });
    });

    describe('calling getAccount', function() {
        it('should add the default workspace "My Workspace" if we do not have any, this happens on getAccount', function(done) {
            accountService.get(usersFixture[2], function(err, account) {
                WorkspaceModel.find({ creator: usersFixture[2]._id }, function(err, foundWorkspaces) {
                    should.exist(foundWorkspaces);
                    foundWorkspaces.length.should.equal(1);
                    foundWorkspaces[0].name.should.equal('My Workspace');

                    done();
                });
            });
        });
    });

    describe('calling createWorkspace', function() {
        it('should create a workspace with the given name', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');
                createdWorkspace.creator.should.equal(user._id);
                createdWorkspace.users.length.should.equal(0);
                done();
            });
        });
    });

    describe('calling getWorkspacesThatUserCreated', function() {
        it('should return the workspaces that we created (for user)', function(done) {
            workspaceService.getWorkspacesThatUserCreated(user, function(err, workspaces) {
                should.exist(workspaces);
                workspaces.length.should.equal(1);

                done();
            });
        });

        it('should return the workspaces that we created (for admin)', function(done) {
            workspaceService.getWorkspacesThatUserCreated(admin, function(err, workspaces) {
                should.exist(workspaces);
                workspaces.length.should.equal(2);

                done();
            });
        });
    });

    describe('calling getWorkspaceByUser', function() {
        it('should return the default workspace of the user if the user has no extra workspaces', function(done) {
            accountService.create('someemail@email.com', 'somePassword', function(err, createdUser) {
                workspaceService.getWorkspacesByUser(createdUser, function(err, workspaces) {
                    should.exist(workspaces);
                    workspaces.length.should.equal(1);

                    done();
                });
            });
        });

        it('should return the workspaces of the user where we are creator of and where we have access to', function(done) {
            workspaceService.getWorkspacesByUser(user, function(err, workspaces) {
                should.exist(workspaces);
                workspaces.length.should.equal(2);

                done();
            });
        });

        it('should return 2 workspaces if we created an extra workspace', function(done) {
            // Create default account
            accountService.create('someemail@email.com', 'somePassword', function(err, createdUser) {
                // Create workspace called "test_workspace"
                workspaceService.create(createdUser, 'test_workspace', function(err, createdWorkspace) {
                    // get workspaces
                    workspaceService.getWorkspacesByUser(createdUser, function(err, workspaces) {
                        should.exist(workspaces);
                        workspaces.length.should.equal(2);

                        done();
                    });
                });
            });
        });
    });

    describe('calling updateName', function() {
        it('should change the name to the new name', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.updateName(user, createdWorkspace._id, 'test_workspace_updated', function(err, result) {
                    workspaceService.getWorkspacesByUser(user, function(err, workspaces) {
                        should.exist(workspaces);

                        workspaces.length.should.equal(3);
                        workspaces[2].name.should.equal("test_workspace_updated");
                        workspaces[2].creator.toString().should.equal(user._id.toString());
                        workspaces[2].users.length.should.equal(0);

                        done();
                    });
                });
            });
        });

        it('should throw an error when another user is trying to change the name', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.updateName(admin, createdWorkspace._id, 'test_workspace_updated', function(err, result) {
                    should.exist(err);
                    err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                    done();
                });
            });
        });
    });

    describe('calling remove', function() {
        it('should remove the workspace from the user', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.remove(user, createdWorkspace._id, function(err, success) {
                    should.exist(success);
                    success.should.equal(true);

                    done();
                });
            });
        });

        it('should return an error if the user doesn\'t own this workspace', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.remove(admin, createdWorkspace._id, function(err, success) {
                    should.exist(err);
                    err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                    done();
                });
            });
        });

        it('should return an error if we try to delete the workspace if it is our only workspace, aka: don\'t allow deleting default workspace', function(done) {
            accountService.create('someemail@email.com', 'somePassword', function(err, createdUser) {
                WorkspaceModel.find({ creator: createdUser._id }, function(err, foundWorkspaces) {
                    workspaceService.remove(createdUser, foundWorkspaces[0]._id, function(err, success) {
                        should.exist(err);
                        err.should.equal('errors.WORKSPACE_ERR_NEED_ONE_LEFT');

                        done();
                    });
                });
            });
        });
    });

    describe('calling addUser', function() {
        it('should add a user to the workspace', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.addUser(user, admin._id, createdWorkspace._id, function(err, success) {
                    should.exist(success);
                    success.should.equal(1);

                    workspaceService.getWorkspacesByUser(user, function(err, workspaces) {
                        should.exist(workspaces);

                        workspaces[2].users.should.containEql(admin._id.toString());

                        done();
                    });
                });
            });
        });

        it('should return an error if we don\'t own the workspace', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.addUser(admin, admin._id, createdWorkspace._id, function(err, success) {
                    should.exist(err);
                    err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                    done();
                });
            });
        });

        it('should return an error if the user that we are trying to add is already added', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.addUser(user, admin._id, createdWorkspace._id, function(err, success) {
                    should.exist(success);
                    success.should.equal(1);

                    workspaceService.addUser(user, admin._id, createdWorkspace._id, function(err, success) {
                        should.exist(err);
                        err.should.equal('errors.WORKSPACE_USER_ALREADY_ADDED');

                        done();
                    });
                });
            });
        });
    });

    describe('calling removeUser', function() {
        it('should remove the user from the workspace users array', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.addUser(user, admin._id, createdWorkspace._id, function(err, success) {
                    should.exist(success);
                    success.should.equal(1);

                    // Remove the user from the workspace
                    workspaceService.removeUser(user, admin._id, createdWorkspace._id, function(err, success) {
                        should.exist(success);
                        success.should.equal(1);

                        workspaceService.getWorkspacesByUser(user, function(err, workspaces) {
                            should.exist(workspaces);
                            workspaces[1].users.should.not.containEql(admin._id.toString());

                            done();
                        });
                    });
                });
            });
        });

        it('should return an error if we don\'t own the workspace', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                workspaceService.addUser(user, admin._id, createdWorkspace._id, function(err, success) {
                    should.exist(success);
                    success.should.equal(1);

                    // Remove the user from the workspace
                    workspaceService.removeUser(admin, admin._id, createdWorkspace._id, function(err, success) {
                        should.exist(err);
                        err.should.equal('errors.WORKSPACE_WRONG_CREATOR');

                        done();
                    });
                });
            });
        });

        it('should return an error if the given user is not in the users array', function(done) {
            workspaceService.create(user, 'test_workspace', function(err, createdWorkspace) {
                should.exist(createdWorkspace);
                createdWorkspace.name.should.equal('test_workspace');

                // Remove the user from the workspace
                workspaceService.removeUser(user, admin._id, createdWorkspace._id, function(err, success) {
                    should.exist(err);
                    err.should.equal('errors.WORKSPACE_NON_EXISTING_USER');

                    done();
                });
            });
        });
    });
});
