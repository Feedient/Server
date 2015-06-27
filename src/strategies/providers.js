var config          = require('../../config/app');
var AuthAPI         = require('./auth');
var FeedAPI         = require('./feed');
var NotificationAPI = require('./notification');
var ActionAPI       = require('./action');
var PagesAPI        = require('./page');

exports.getAuthAPI = function(providerName) {
    var authAPI = new AuthAPI();
    var AuthStrategy = require('./provider/auth/' + providerName);
    var authService = new AuthStrategy(config.providers[providerName]);

    authAPI.use(authService);

    return authAPI;
};

exports.getFeedAPI = function(providerName) {
    var feedAPI = new FeedAPI();
    var AuthStrategy = require('./provider/auth/' + providerName);
    var authService = new AuthStrategy(config.providers[providerName]);

    var ProviderStrategy = require('./provider/feed/' + providerName);
    var providerService = new ProviderStrategy(authService, config.providers[providerName]);

    feedAPI.use(providerService);

    return feedAPI;
};

exports.getPagesAPI = function(providerName) {
    var pagesAPI = new PagesAPI();
    var AuthStrategy = require('./provider/auth/' + providerName);
    var authService = new AuthStrategy(config.providers[providerName]);

    var ProviderStrategy = require('./provider/page/' + providerName);
    var providerService = new ProviderStrategy(authService, config.providers[providerName]);

    pagesAPI.use(providerService);

    return pagesAPI;
};

exports.getNotificationAPI = function(providerName) {
    var notificationAPI = new NotificationAPI();

    var AuthStrategy = require('./provider/auth/' + providerName);
    var authService = new AuthStrategy(config.providers[providerName]);

    var ProviderStrategy = require('./provider/notification/' + providerName);
    var providerService = new ProviderStrategy(authService, config.providers[providerName]);

    notificationAPI.use(providerService);

    return notificationAPI;
};

exports.getActionAPI = function(providerName) {
    var actionAPI = new ActionAPI();
    var AuthStrategy = require('./provider/auth/' + providerName);
    var authService = new AuthStrategy(config.providers[providerName]);

    var ProviderStrategy = require('./provider/action/' + providerName);
    var providerService = new ProviderStrategy(authService, config.providers[providerName]);

    actionAPI.use(providerService);

    return actionAPI;
};
