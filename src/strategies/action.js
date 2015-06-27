function ActionAPI() {
    this.name = 'ActionAPI';
};

ActionAPI.prototype.use = function(strategy) {
    this.strategy = strategy;
};

ActionAPI.prototype.doAction = function(userProvider, actionName, payload, callback) {
    // check if we got the action
    if (this.strategy.hasAction(actionName)) {
        return this.strategy[actionName](userProvider, payload, callback);
    }

    return callback('errors.ACTION_NOT_FOUND');
};

module.exports = ActionAPI;
