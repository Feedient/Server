var Joi = require('joi');

var postSchema = require("../providerPost");

var schema = Joi.object({
    posts: Joi.array().includes(postSchema),
    pagination: Joi.array().includes(Joi.object({
        providerId: Joi.string(),
        since: Joi.string()
    }))
});

module.exports = schema;
