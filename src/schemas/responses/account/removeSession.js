var Joi = require('joi');

var schema = Joi.object({
    success: Joi.boolean().required(),
});

module.exports = schema;
