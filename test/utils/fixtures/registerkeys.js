var async           = require('async');
var ObjectId        = require('mongodb').ObjectID;

var collectionName  = "registerkeys";
var data = [
    {
        "key" : "TESTKEY1",
        "_id" : ObjectId("5409bed7c0d227f6073b6f0f"),
        "date_added" : new Date("2014-09-05T13:47:03.077Z"),
        "usages" : 1,
        "__v" : 0
    }
];

module.exports = data;
