var Joi = require('joi');

var schema = Joi.object({
    small_picture: Joi.object({
        url: Joi.string().required(),
        width: Joi.number().required(),
        height: Joi.number().required()
    }).required(),
    large_picture: Joi.object({
        url: Joi.string().required(),
        width: Joi.number().required(),
        height: Joi.number().required()
    }).required(),
    caption: Joi.string().required().allow("")
});

module.exports = schema;
