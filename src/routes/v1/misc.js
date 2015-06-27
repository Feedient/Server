'use strict';

var Joi		= require('joi');
var mail    = require('../../controllers/mail');
var routes  = require('../../controllers/routes');

var routes = [
    {
        method: 'POST',
        path: '/contact',
        config: {
            handler: mail.sendContactEmail,
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().required(),
                    cause: Joi.string().valid(['CONTACT_CAUSE_SUPPORT', 'CONTACT_CAUSE_OTHER', 'CONTACT_CAUSE_PRESS', 'CONTACT_CAUSE_BUGS']).required(),
                    message: Joi.string().required()
                }
            },
            description: 'Sends an email with the cause to our contact email.',
            notes: 'No authentication required',
            tags: ['api']
        }
    }
];

module.exports.routes = function (server) {
    server.route(routes);
};
