var Joi = require('joi');

var schema = Joi.object({
    _id: Joi.string().required(),
    email: Joi.string().required(),
    language: Joi.string().required(),
    role: Joi.string().required(),
    workspaces: Joi.array().includes(Joi.object({
        name: Joi.string().required(),
        creator: Joi.string().required(),
        id: Joi.string().required(),
        date_added: Joi.date(),
        users: Joi.array().includes(Joi.string()),
        isOwner: Joi.boolean()
    }))
});

module.exports = schema;
