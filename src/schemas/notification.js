var Joi = require('joi');

var schema = Joi.object({
    id: Joi.string().required(),
    created_time: Joi.date().required(),
    link: Joi.string(),
    read: Joi.number(),
    user_from: Joi.object({
        id: Joi.string().required().allow(""),
        name: Joi.string().required().allow(""),
        name_formatted: Joi.string().allow(""),
        image: Joi.string().allow(""),
        profile_link: Joi.string().required().allow("")
    }),
    user_to: Joi.object({
        id: Joi.string().required().allow(""),
        name: Joi.string().required().allow(""),
        image: Joi.string().allow(""),
        profile_link: Joi.string().required().allow("")
    }),
    pagination: Joi.object({
        since: Joi.string().required()
    }).required(),
    content: Joi.object({
        message: Joi.string()
    })
});

module.exports = schema;
