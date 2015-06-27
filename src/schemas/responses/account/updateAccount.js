var Joi = require('joi');

var schema = Joi.array().includes(Joi.object({
    success: Joi.boolean().required(),
}));

module.exports = schema;
