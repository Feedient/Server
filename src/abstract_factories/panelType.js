var feedAPI         = require('../strategies/panel_type/feed');
var notificationAPI = require('../strategies/panel_type/notification');
var pagesAPI        = require('../strategies/panel_type/page');
var objectUtil      = require('../util/object');
var panelTypeEnum   = require('../enum/panelType');

var abstractPanelTypeFactory = (function() {
    var types = {};

    return {
        getPanelTypeApi: function(typeId, callback) {
            var values = objectUtil.getObjectValues(panelTypeEnum);
            var keys = Object.keys(panelTypeEnum);

            for (var i in values) {
                if (values[i] == typeId) {
                    var keyName = keys[i].toLowerCase();

                    if (types[keyName]) {
                        return callback(null, new types[keyName]);
                    }
                }
            }

            return callback('errors.panel.api_not_found');
        },

        registerPanelType: function(type, api) {
            types[type] = api;
            return abstractPanelTypeFactory;
        }
    };
})();

abstractPanelTypeFactory.registerPanelType("feed", feedAPI);
abstractPanelTypeFactory.registerPanelType("notification", notificationAPI);
abstractPanelTypeFactory.registerPanelType("page", pagesAPI);

module.exports = abstractPanelTypeFactory;
