var config = require('../../config/app');
var stripe = require("stripe")(config.stripe.secret_key);

exports.chargeCard = function(stripeToken, price, description, callback) {
    description = description || "";

    var charge = stripe.charges.create({
        amount: price, // in cents!
        currency: "eur",
        card: stripeToken,
        description: description
    }, function(err, charge) {
        if (err && err.type === 'StripeCardError') {
            // Card declined
            return callback(err);
        }

        if (err) {
            return callback(err);
        }

        // Success
        if (!err) {
            return callback(null, charge);
        }
    });
};
