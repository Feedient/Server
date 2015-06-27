var i18n = require('i18n');
var locale = require('locale');

var internals = {};

exports.register = function (plugin, options, next) {
    // Set the options
    internals.options = options || defaultOptions;

    i18n.configure(options);

    // Add request.i18n
    plugin.ext('onPreHandler', function(request, extNext) {
        var selectedLocale = getBestLocale(options, request);

        //plugin.log(['plugin', 'info'], 'Locale set on: ' + selectedLocale);

        i18n.setLocale(selectedLocale);

        request.i18n = i18n;
        extNext();
    });

    plugin.log(['plugin', 'info'], exports.register.attributes.pkg.name + ' registered');

    return next();
};

/**
 * Get the best matching locale for the current user.
 * 1. If user credentials set, then we use the language set by the user
 * 2. If user credentials not set, then we use the language in the browser settings
 */
var getBestLocale = function(options, request) {
    var credentials = request.auth.credentials;

    // If we are logged in and got a language key
    if (credentials && credentials.language) {
        var bestMatch = credentials.language;
        return bestMatch;
    }

    // Else get the best matching locale
    var locales = new locale.Locales(request.headers['accept-language']);
    var supported = new locale.Locales(options.locales);

    var bestMatch = locales.best(supported);

    return bestMatch;
}

// Export the plugin name and version to the registration engine
exports.register.attributes = {
    pkg: require('../package.json')
};
