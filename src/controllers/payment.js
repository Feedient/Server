var paymentService   = require('../services/payment');
var accountService	 = require('../services/account');

exports.payRemoveAdsOneMonth = function(request, reply) {
    // Get payload
    var expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 30); // 30 days

    var stripeToken = request.payload.stripeToken;
    var userEntity = request.auth.credentials;
    var price = 099; // It's in cents
    var description = "Upgraded to Ad-Free for " + userEntity.email;

    paymentService.chargeCard(stripeToken, price, description, function(err, response) {
        if (err) return reply({ err: err });

        userEntity.setRole('USER_AD_FREE', expireTime, function(err, success) {
            if (err) return reply({ err: "Failed to upgrade role, please open a ticket" });
            return reply({ success: true });
        });
    });
};

exports.payRemoveAdsForThreeMonths = function(request, reply) {
    // Get payload
    var expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 90); // 90 days

    var stripeToken = request.payload.stripeToken;
    var userEntity = request.auth.credentials;
    var price = 199; // It's in cents
    var description = "Upgraded to Ad-Free for " + userEntity.email;

    paymentService.chargeCard(stripeToken, price, description, function(err, response) {
        if (err) return reply({ err: err });

        userEntity.setRole('USER_AD_FREE', expireTime, function(err, success) {
            if (err) return reply({ err: "Failed to upgrade role, please open a ticket" });
            return reply({ success: true });
        });
    });
};

exports.payRemoveAdsForSixMonths = function(request, reply) {
    // Get payload
    var expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 180); // 180 days

    var stripeToken = request.payload.stripeToken;
    var userEntity = request.auth.credentials;
    var price = 299; // It's in cents
    var description = "Upgraded to Ad-Free for " + userEntity.email;

    paymentService.chargeCard(stripeToken, price, description, function(err, response) {
        if (err) return reply({ err: err });

        userEntity.setRole('USER_AD_FREE', expireTime, function(err, success) {
            if (err) return reply({ err: "Failed to upgrade role, please open a ticket" });
            return reply({ success: true });
        });
    });
};

exports.payRemoveAdsForLifetime = function(request, reply) {
    var expireTime = new Date();
    expireTime.setDate(expireTime.getDate() + 36500); // 36500 days = 100 year

    // Get payload
    var now = new Date();
    var stripeToken = request.payload.stripeToken;
    var userEntity = request.auth.credentials;
    var price = 899; // It's in cents
    var description = "Upgraded to Ad-Free for " + userEntity.email;

    paymentService.chargeCard(stripeToken, price, description, function(err, response) {
        if (err) return reply({ err: err });

        userEntity.setRole('USER_AD_FREE', expireTime, function(err, success) {
            if (err) return reply({ err: "Failed to upgrade role, please open a ticket" });
            return reply({ success: true });
        });
    });
};
