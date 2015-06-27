var async           = require('async');
var ObjectId        = require('mongodb').ObjectID;
var ISODate         = require('mongodb').ISODate;

var collectionName  = "usersessions";
var data = [
    // Admin user it's session
    // [0]
    {
        "userId" : ObjectId("532eec0395d6644b0bd5ff9f"),
        "token" : "0de6d83e289e5c4a7df8159c819e106389eb885c8ed6de4869be554dcd969368",
        "platform" : "Mac OS X",
        "browser" : "Chrome",
        "ipAddress" : "192.168.0.1",
        "lastLogin" : new Date("2014-03-23T14:13:25.792Z"),
        "_id" : ObjectId("532eec0395d6644b0bd5ffa0"),
        "__v" : 0
    },

    // Normal user it's session
    // [1]
    {
        "userId" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "token" : "d7e632c2d721d32d13cb498115cd31c3e37ad53b27fe8dbb0391cb8f43a425bd",
        "platform" : "Mac OS X",
        "browser" : "Chrome",
        "ipAddress" : "192.168.0.1",
        "lastLogin" : new Date("2014-03-25T18:37:58.167Z"),
        "_id" : ObjectId("5331cd04b92edd790ad7ca6c"),
        "__v" : 0
    }
];

module.exports = data;
