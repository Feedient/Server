var ObjectId        = require('mongodb').ObjectID;

var collectionName  = "userproviders";
var data = [
    // Normal User Provider Accounts
    // [0] Instagram
    {
        "_id" : ObjectId("536f9a4658992b80138ab919"),
        "userId" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "providerName" : "instagram",
        "providerUserId" : "41491221",
        "providerAccount" : {
            "userFullName" : "",
            "username" : "feedient"
        },
        "providerTokens" : {
            "accessToken" : "41491221.c80009c.9ec4492a242a65f79049f47"
        },
        "dateAdded" : new Date("2014-05-11T15:41:58.373Z"),
        "order" : 1,
        "__v" : 0
    },
    // [1] Tumblr
    {
        "_id" : ObjectId("53745ec4e8ee9ac1069917ee"),
        "userId" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "providerName" : "tumblr",
        "providerUserId" : "feedient",
        "providerAccount" : {
            "userFullName" : "feedient",
            "username" : "feedient"
        },
        "providerTokens" : {
            "accessToken" : "OnW2OHASvde6CNqJsJEI2uYrgszhk1l1RpjEbOxR75GQb",
            "accessTokenSecret" : "fgxjB7OA0uNyxF4rFloDGqrQdXsbEc4JPdqpdmdbprA"
        },
        "dateAdded" : new Date("2014-05-15T06:29:24.855Z"),
        "order" : 2,
        "__v" : 0
    },
    // [2] YouTube
    {
        "_id" : ObjectId("537470cbe23a6b310bbb55c8"),
        "userId" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "providerName" : "youtube",
        "providerUserId" : "UCdSyeBzNs_wJ1UIPzBMAQ",
        "providerAccount" : {
            "channelId" : "UCdSyeBzNs_wJ1UIPzBMAQ",
            "userFullName" : "Feedient Team",
            "username" : "Feedient Team"
        },
        "providerTokens" : {
            "accessToken" : "ya29.GQAa-HdsG5XJ7iAAA62_C42tw22m7gz91O6Jh7yV-1NjfkuNhtuGbfw",
            "refreshToken" : "1/wWEkqrMiFhtf_qvR5DirbQLp7VMEf1ItW3-g",
            "expires" : new Date("2014-05-17T18:29:08.622Z"),
            "tokenType" : "Bearer"
        },
        "dateAdded" : new Date("2014-05-15T07:46:19.832Z"),
        "order" : 3,
        "__v" : 0
    },
    // [3] Twitter
    {
        "_id" : ObjectId("5377aa770a7a6355070a0228"),
        "userId" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "providerName" : "twitter",
        "providerUserId" : "68936285",
        "providerAccount" : {
            "userFullName" : "feedient",
            "username" : "feedient"
        },
        "providerTokens" : {
            "accessTokenSecret" : "EJcYxquiZppj1z7K7YO9aEcjLhyjQCTbOXnIw",
            "accessToken" : "68936285-fgb68RPMoj0Ah5kjDRT7LRV1DfOkaCH2wAvg"
        },
        "dateAdded" : new Date("2014-05-17T18:29:11.652Z"),
        "order" : 4,
        "__v" : 0
    },
    // [4] Facebook
    {
        "_id" : ObjectId("5377ac4fa2fa701a08bc5490"),
        "userId" : ObjectId("5331cd04b92edd790ad7ca6b"),
        "providerName" : "facebook",
        "providerUserId" : "147007794",
        "providerAccount" : {
            "userFullName" : "Feedient Team"
        },
        "providerTokens" : {
            "expires" : new Date("2014-05-17T20:03:27.014Z"),
            "accessToken" : "CAAGcZCEBAOhbXYYDevd4aU9oKsFkZBuVM9ZAFyXhMZCvfHsV7Iy41ytANORPGzeczaXAP3gr5mRJTqr3uHSTPRiw9Xdb6U2I4qvnuRYSBZAUR9zzYbuMVPyyi50H0HsatZBOj1LZAlTDopILlZBJ9yhU4ZD"
        },
        "dateAdded" : new Date("2014-05-17T18:37:03.573Z"),
        "order" : 5,
        "__v" : 0
    },
    // Admin User Provider Accounts
    // [5] Facebook
    {
        "_id" : ObjectId("5377ac4fa2fa701a08bc5480"),
        "userId" : ObjectId("532eec0395d6644b0bd5ff9f"),
        "providerName" : "facebook",
        "providerUserId" : "147007794",
        "providerAccount" : {
            "userFullName" : "Feedient Team"
        },
        "providerTokens" : {
            "expires" : new Date("2014-05-17T20:03:27.014Z"),
            "accessToken" : "CAAGcZCEBAOhbXYYDevd4aU9oKsFkZBuVM9ZAFyXhMZCvfHsV7Iy41ytANORPGzeczaXAP3gr5mRJTqr3uHSTPRiw9Xdb6U2I4qvnuRYSBZAUR9zzYbuMVPyyi50H0HsatZBOj1LZAlTDopILlZBJ9yhU4ZD"
        },
        "dateAdded" : new Date("2014-05-17T18:37:03.573Z"),
        "order" : 1,
        "__v" : 0
    }
];

module.exports = data;
