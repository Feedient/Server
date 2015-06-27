var async           = require('async');
var ObjectId        = require('mongodb').ObjectID;
var ISODate         = require('mongodb').ISODate;

var collectionName  = "workspaces";
var data = [
    // [0] User workspace
    {
        "name" : "My Workspace",
        "creator" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "_id" : ObjectId("53f60d9dd849b29d06b5bd0b"),
        "dateAdded" : new Date("2014-08-21T15:17:49.145Z"),
        "users" : [],
        "__v" : 0
    },
    // [1] Admin workspaces
    {
        "name" : "My Workspace",
        "creator" : ObjectId("532eec0395d6644b0bd5ff9f"),
        "_id" : ObjectId("53f60d9dd849b29d06b5bd9b"),
        "dateAdded" : new Date("2014-08-21T15:17:49.145Z"),
        "users" : [],
        "__v" : 0
    },
    // [2] Admin Workspaces
    {
        "name" : "My Second Workspace where user 1 has access too",
        "creator" : ObjectId("532eec0395d6644b0bd5ff9f"),
        "_id" : ObjectId("53f60d9dd849b29d0695bd0b"),
        "dateAdded" : new Date("2014-08-21T15:17:49.145Z"),
        "users" : ["5331cd04b92edd790ad7ca6b"],
        "__v" : 0
    },
    // [3] Random creator Workspaces
    {
        "name" : "My Second Workspace",
        "creator" : ObjectId("000000000000000000000000"),
        "_id" : ObjectId("53f60d9dd849b9990695bd0b"),
        "dateAdded" : new Date("2014-08-21T15:17:49.145Z"),
        "users" : [],
        "__v" : 0
    }
];

module.exports = data;
