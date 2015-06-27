var Joi = require('joi');

var schema = Joi.object({
    sessions: Joi.array().includes(Joi.object({
        userId: Joi.string().required(),
        token: Joi.string().required(),
        platform: Joi.string().required(),
        browser: Joi.string().required(),
        ipAddress: Joi.string().required(),
        lastLogin: Joi.date().required(),
        _id: Joi.string().required()
    })),
});

module.exports = schema;
