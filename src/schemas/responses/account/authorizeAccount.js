var Joi = require('joi');

var schema = Joi.object({
    uid: Joi.string().required(),
    token: Joi.string().required()
});

module.exports = schema;
