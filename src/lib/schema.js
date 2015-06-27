function Schema(obj) {
    this.obj = obj;
    this.nested = {};

    if (obj) {
        this.add(obj);
    }
}

/**
 * Adds key path / schema type pairs to this schema.
 *
 * ####Example:
 *
 *     var ToySchema = new Schema;
 *     ToySchema.add({ name: 'string', color: 'string', price: 'number' });
 *
 * @param {Object} obj
 * @param {String} prefix
 * @api public
 */

Schema.prototype.add = function(obj, prefix) {
    prefix = prefix || '';
    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];

        if (null == obj[key]) {
            throw new TypeError('Invalid value for schema path `'+ prefix + key +'`');
        }

        if (isObject(obj[key]) && (!obj[key].constructor || 'Object' == obj[key].constructor.name) && (!obj[key].type || obj[key].type.type)) {
            if (Object.keys(obj[key]).length) {
                // nested object { last: { name: String }}
                this.nested[prefix + key] = true;
                this.add(obj[key], prefix + key + '.');
            } else {
                this.path(prefix + key, obj[key]); // mixed type
            }
        }
    }
};

var isObject = function(object) {
    if (typeof object === 'object' && object !== null) {
        return true;
    }

    return false;
}

module.exports = Schema;