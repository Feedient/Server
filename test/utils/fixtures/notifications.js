var ObjectId        = require('mongodb').ObjectID;

var collectionName  = "notifications";
var data = [
    // Facebook notifications
    {
        "_id": ObjectId("539f05f386fd9d4d5c373601"),
        "notificationId": "notif_1470077194_90643216",
        "providerId": ObjectId("5377ac4fa2fa701a08bc5490"),
        "read": 1,
        "dateAdded": new Date()
    },
    {
        "_id": ObjectId("539f05f386fd9d4d5c373602"),
        "notificationId": "notif_1470077194_90589925",
        "providerId": ObjectId("5377ac4fa2fa701a08bc5490"),
        "read": 0,
        "dateAdded": new Date()
    },
    {
        "_id": ObjectId("539f05f386fd9d4d5c373603"),
        "notificationId": "notif_1470077194_90512710",
        "providerId": ObjectId("5377ac4fa2fa701a08bc5490"),
        "read": 1,
        "dateAdded": new Date()
    },
    // Twitter notifications
    {
        "_id": ObjectId("539f05f386fd9d4d5c373604"),
        "notificationId": "471229444607471617",
        "providerId": ObjectId("5377aa770a7a6355070a0228"),
        "read": 1,
        "dateAdded": new Date()
    },
    {
        "_id": ObjectId("539f05f386fd9d4d5c373605"),
        "notificationId": "457110663392157696",
        "providerId": ObjectId("5377aa770a7a6355070a0228"),
        "read": 1,
        "dateAdded": new Date()
    },
    {
        "_id": ObjectId("539f05f386fd9d4d5c373606"),
        "notificationId": "453922566466703360",
        "providerId": ObjectId("5377aa770a7a6355070a0228"),
        "read": 1,
        "dateAdded": new Date()
    }
];

module.exports = data;
