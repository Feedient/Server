var Joi = require('joi');

var schema = Joi.array().includes(
    Joi.object({
        providerId: Joi.string().required(),
        since: Joi.string().required().allow("") // If since is empty, then we got no previous posts so load posts
    })
);

module.exports = schema;
