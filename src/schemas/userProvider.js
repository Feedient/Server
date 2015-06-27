var Joi = require('joi');

var schema = Joi.object({
    id: Joi.string().required(),
    order: Joi.number().required(),
    date_added: Joi.date().required(),
    provider: Joi.object({
        name: Joi.string().required(),
        username: Joi.string().required().allow(""),
        user_id: Joi.string().required().allow(""),
        full_name: Joi.string().required().allow(""),
        user_avatar: Joi.string().required().allow(""),
        authentication: Joi.object({
            access_token: Joi.string().required()
        })
    }).required()
});

module.exports = schema;
