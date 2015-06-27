var Joi = require('joi');

var schema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    access_token: Joi.string().required(),
    permissions: Joi.array().required()
});

module.exports = schema;
