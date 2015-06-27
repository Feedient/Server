var async           = require('async');
var ObjectId        = require('mongodb').ObjectID;

var collectionName  = "users";
var data = [
    // [0] username: admin@admin.be, password: admin
    {
        "email" : "admin@admin.be",
        "password" : "$2a$10$SrlncrZd4InQd3fj/YVxr.l5vLTe5am3Zd1f5thIndlIDP/Ph4Zhi",
        "role" : "ADMIN",
        "_id" : ObjectId("532eec0395d6644b0bd5ff9f"),
        "recoverCount" : 0,
        "recoverKey" : "",
        "language" : "en_GB",
        "loginAttempts" : 0,
        "dateCreated" : new Date("2014-03-23T14:13:23.652Z"),
        "isDeleted": false,
        "lastLogin": new Date("2014-03-23T14:13:23.652Z"),
        "__v" : 0
    },

    // [1] username: user@user.be, password: user123
    {
        "email" : "user@user.be",
        "password" : "$2a$10$wMguMX4YrQjrzmW4ZVwPv.d/BUjJLU9A7YPIdJdgo98pX4HCNoGJa",
        "role" : "USER",
        "_id" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "recoverCount" : 0,
        "recoverKey" : "",
        "language" : "en_GB",
        "loginAttempts" : 0,
        "dateCreated" : new Date("2014-03-25T18:37:56.438Z"),
        "isDeleted": false,
        "lastLogin": new Date("2014-03-23T14:13:23.652Z"),
        "__v" : 0
    },

    // [2] username: random@random.be, password: /, user with no workspaces logging in
    {
        "email" : "random@random.be",
        "password" : "$2a$10$wMguMX4YrQjrzmW4ZVwPv.d/BUU9A7YPIdJdgo98pX4HCNoGJa",
        "role" : "USER",
        "_id" : ObjectId("5331cd04c92edd790ad7ca6b"),
        "recoverCount" : 0,
        "recoverKey" : "",
        "language" : "en_GB",
        "loginAttempts" : 0,
        "dateCreated" : new Date("2014-03-25T18:37:56.438Z"),
        "isDeleted": false,
        "lastLogin": new Date("2014-03-23T14:13:23.652Z"),
        "__v" : 0
    },
];

module.exports = data;
