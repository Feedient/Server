var util            = require('util');
var Wreck           = require('wreck');
var BaseStrategy    = require('./Base');

function Strategy(options) {
    options = options || {};
    options.callbackURL = options.callbackURL || "";

    BaseStrategy.call(this, options);

    this.name = 'rss';
};

util.inherits(Strategy, BaseStrategy);

Strategy.prototype.handleCallback = function(payload, callback) {
    var self = this;
    var url = payload.rss_url || "";
    var name = payload.rss_name || "";
    var favicon = payload.rss_favicon || "";

    var provider = {
        providerName: self.name,
        userId: payload.rss_url,
        account: {
            url: url,
            name: name,
            avatar: favicon
        },
        tokens: {

        }
    };
    // We do not add providerAccounts
    //@todo figure out how we are going to save the url's
    return callback(null, [provider]);
};

Strategy.prototype.formatProvider = function(providerAccount) {
    if (!providerAccount) {
        return null;
    }

    var json = {};

    // Basic details
    json.id = providerAccount['_id'].toString();
    json.order = providerAccount['order'];
    json.date_added = providerAccount['dateAdded'];

    // Provider details
    json.provider = {};
    json.provider.name = providerAccount['providerName'];
    json.provider.username = providerAccount['providerAccount']['name'] || "";

    return json;
};

module.exports = function(options) {
    return new Strategy(options);
};
