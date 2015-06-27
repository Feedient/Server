var async           = require('async');
var ObjectId        = require('mongodb').ObjectID;
var ISODate         = require('mongodb').ISODate;
var PanelTypes      = require('../../../src/enum/panelType');

var collectionName  = "panels";
var data = [
    // [0] User Inbox Panel
    {
        "_id" : ObjectId("53f60d9dd845e29d06b5bd0b"),
        "__v" : 0,
        "workspaceId": ObjectId("53f70d9ad849b29d06b5bd0b"),
        "name" : "My Inbox",
        "type" : PanelTypes.INBOX,
        "order": 1,
        "providerAccounts": [],
        "date_added" : new Date("2014-08-21T15:17:49.145Z")
    },
    // [1] User Feed Panel
    {
        "_id" : ObjectId("53f80d9dd845999d06b5bd0b"),
        "__v" : 0,
        "workspaceId": ObjectId("53f60d9dd849b29d06b5bd0b"),
        "name" : "My Feed",
        "type" : PanelTypes.FEED,
        "order": 1,
        "providerAccounts": [],
        "date_added" : new Date("2014-08-21T15:17:49.145Z")
    },
    // [2] User Statistics Panel
    {
        "_id" : ObjectId("53d60d9dd845e29d06b5bd0b"),
        "__v" : 0,
        "workspaceId": ObjectId("53f60d9dd849b29d06b5bd0b"),
        "name" : "My Statistics",
        "type" : PanelTypes.ANALYTICS,
        "order": 1,
        "providerAccounts": [],
        "date_added" : new Date("2014-08-21T15:17:49.145Z")
    },
    // [3] Admin Shared Statistics Panel
    {
        "_id" : ObjectId("53f60d9dd845e29d06b5bd0b"),
        "__v" : 0,
        "workspaceId": ObjectId("53f60d9dd849b29d0695bd0b"),
        "name" : "My Statistics",
        "type" : PanelTypes.ANALYTICS,
        "order": 1,
        "providerAccounts": [],
        "date_added" : new Date("2014-08-21T15:17:49.145Z")
    },
    // [4] User Notification Panel
    {
        "_id" : ObjectId("53d60d9dd845e23d06c5bd0b"),
        "__v" : 0,
        "workspaceId": ObjectId("53f60d9dd849b29d06b5bd0b"),
        "name" : "My Notifications",
        "type" : PanelTypes.NOTIFICATION,
        "order": 1,
        "providerAccounts": ["53f60d9dd845e29d06b5bd0b"],
        "date_added" : new Date("2014-08-21T15:17:49.145Z")
    },
    // [5] User Notification Panel
    {
        "_id" : ObjectId("53d60d9ee845e23d06c5bd0b"),
        "__v" : 0,
        "workspaceId": ObjectId("53f60d9dd849b29d06b5bd0b"),
        "name" : "My Unexisting Panel Type",
        "type" : 999999999,
        "order": 1,
        "providerAccounts": ["53f60d9dd845e29d06b5bd0b"],
        "date_added" : new Date("2014-08-21T15:17:49.145Z")
    }
];

module.exports = data;
