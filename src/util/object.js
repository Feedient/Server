/**
 * Get the values for every key in an object
 * @param {object} object
 */
exports.getObjectValues = function(object) {
    var keys = Object.keys(object);
    var values = [];

    for (var i = 0; i < keys.length; i++) {
        values.push(object[keys[i]]);
    }

    return values;
};
