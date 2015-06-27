function BaseStrategy(options) {
    options = options || {};
    options.callbackURL = options.callbackURL || "";

    this._callbackURL = options.callbackURL;
};

/**
 * The processDetails function is there to process the received details from
 * the client, It will store those in the providerDetails object in mongodb
 */
BaseStrategy.prototype.onProcessDetails = function(payload, callback) {
    return callback(null, {});
}

/**
 * Format the provider details when returning it to the frontend
 * (Example: used when getting the providers GET /user)
 *
 * Note: Not an async call
 */
BaseStrategy.prototype.formatProvider = function(providerAccount) {
    if (!providerAccount) {
        return null;
    }

    if (!providerAccount['providerAccount']) {
        providerAccount['providerAccount'] = {
            username: "undefined",
            userFullName: "undefined"
        };
    }

    var json = {};

    // Basic details
    json.id = providerAccount['_id'].toString();
    json.order = providerAccount['order'];
    json.date_added = providerAccount['dateAdded'];

    // Provider details
    json.provider = {};
    json.provider.name = providerAccount['providerName'];
    json.provider.username = providerAccount['providerAccount']['username'] || "";
    json.provider.user_id = providerAccount['providerUserId'] || "";
    json.provider.full_name = providerAccount['providerAccount']['userFullName'] || "";
    json.provider.user_avatar = providerAccount['providerAccount']['avatar'] || "";

    // Auth details
    json.provider.authentication = {};
    json.provider.authentication.access_token = providerAccount['providerTokens'] ? providerAccount['providerTokens']['accessToken'] : null;

    return json;
};

/**
 * HandleCallback will be called when we call the createProvider endpoint.
 * This will create our account and return the accounts that we created.
 *
 * @return callback(err, providerAccounts);
 */
BaseStrategy.prototype.handleCallback = function(payload, callback) {
    return callback(null, []);
};

module.exports = BaseStrategy;
