'use strict';

var fs               = require('fs');
var config           = require('../../config/app');

var fallbackLanguage = config.msgFormatter.fallbackLanguage || 'en_GB';
var fallbackFile     = config.msgFormatter.fallbackFile || 'errors';
var fallbackError    = config.msgFormatter.fallbackError || 'An unknown error has occurred.';

/**
 * Get an error, this returns the JSON format:
 * {
 *     error: {
 *         type: 'SomeType',
 *         message: 'Some Message Given'
 *     }
 * }
 * 
 * @param request
 * @param type      The error type (example: AuthException)
 * @param message   The key for the message (example: UNKNOWN_ERROR)
 * 
 * @return JSON
 */
function getError(type, message, errorCode, content, request) {
    if (!type || !message || !errorCode) {
        return getBasicError(type, message, errorCode);
    }
    
    var language = extractLanguageFromRequest(request);
    
    var error = {
        error: { 
            type: type, 
            message: convertMessageKeyToValue('errors', language, message),
            code: errorCode
        } 
    }
        
    if (content) error.error.content = content;
    
    return error;
}

function getBasicError(type, message, errorCode) {
	if (!type) type = "Unknown";
	if (!message) message = "An unknown error has occurred.";
	if (!errorCode) errorCode = 0;

    var error = {
        error: { 
            type: type, 
            message: convertMessageKeyToValue('errors', fallbackLanguage, message),
            code: errorCode
        } 
    }
    
    return error;    
}

/**
 * Gets the message key value and returns it
 * @param message
 * @return value
 */
function getMessage(message) {
    return convertMessageKeyToValue(fallbackFile, fallbackLanguage, message);
}

/**
 * Try to extract the language from the request user
 * This is located in request.artifacts.user.language
 * 
 * If Found --> Return user language
 * Else     --> Return fallbackLanguage
 */
function extractLanguageFromRequest(request) {
    var language;
    
    if (request && request.auth && request.auth.credentials && request.auth.credentials.language) {
        language = request.auth.credentials.language;    
    }
    
    if (language) {
        return language;    
    }
    
    return fallbackLanguage;
}

/**
 * Gets the message for the given file, language and message key
 * 
 * 1. Returns the message in the specified language for the specified key
 * 2. Returns the message for the fallback language for the specified key
 * 3. Returns the fallbackMessage (Unknown error)
 */
function convertMessageKeyToValue(file, language, message) {
    if (file === undefined || language === undefined) {
        file = fallbackFile;
        language = fallbackLanguage;
    }
    
    // Check if the directory exists
    var langFileName = (language || fallbackLanguage) + '/' + (file || fallbackFile) + '.json';
    
    // Try to get the language, else return the error
    try {
        var langFile = require('../locales/' + langFileName);
        
        // If we got a languageFile and the key exists, then return the message
        if (langFile && langFile[message]) {
            return langFile[message];
        }
    } catch (ex) {
        return message;
    }
    
    // Return error
    return message || fallbackError;
}

module.exports = {
    getMessage: getMessage,
    getError: getError
};