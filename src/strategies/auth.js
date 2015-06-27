function AuthAPI() {
    this.name = 'AuthAPI';
};

AuthAPI.prototype.use = function(authStrategy) {
    this.strategy = authStrategy;
};

AuthAPI.prototype.handleCallback = function(payload, callback) {
    this.strategy.handleCallback(payload, callback);
};

AuthAPI.prototype.getRequestToken = function(callback) {
    this.strategy.getRequestToken(callback);
};

AuthAPI.prototype.checkAccessToken = function(userProvider, data, callback) {
    this.strategy.checkAccessToken(userProvider, data, callback);
};

AuthAPI.prototype.getProfile = function(tokens, callback) {
    if (this.strategy.getProfile) {
        this.strategy.getProfile(tokens, callback);
    } else {
        callback(null, []);
    }
};

AuthAPI.prototype.onProcessProfiles = function(tokens, result, callback) {
    if (this.strategy.onProcessProfiles) {
        this.strategy.onProcessProfiles(tokens, result, callback);
    } else {
        callback(null, []);
    }
};

AuthAPI.prototype.formatProvider = function(provider) {
    return this.strategy.formatProvider(provider);
};

module.exports = AuthAPI;
