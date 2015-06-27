var Joi = require('joi');

var schema = Joi.object({
    key: Joi.string().required()
});

module.exports = schema;
