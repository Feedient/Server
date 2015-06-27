'use strict';

var Joi                                     = require('joi');
var account                                 = require('../../controllers/account');
var mail                                    = require('../../controllers/mail');
var authorizeAccountResponse                = require('../../schemas/responses/account/authorizeAccount');
var createAccountResponse                   = require('../../schemas/responses/account/createAccount');
var generateInvitationKeyResponse           = require('../../schemas/responses/account/generateInvitationKey');
var getAccountResponse                      = require('../../schemas/responses/account/getAccount');
var getSessionsResponse                     = require('../../schemas/responses/account/getSessions');
var logoutResponse                          = require('../../schemas/responses/account/logout');
var recoverPasswordConfirmEmailResponse     = require('../../schemas/responses/account/recoverPasswordConfirmEmail');
var recoverPasswordVerifyResetTokenResponse = require('../../schemas/responses/account/recoverPasswordVerifyResetToken');
var removeAccountResponse                   = require('../../schemas/responses/account/removeAccount');
var removeSessionResponse                   = require('../../schemas/responses/account/removeSession');
var updateAccountResponse                   = require('../../schemas/responses/account/updateAccount');
var updateEmailConfirmResponse              = require('../../schemas/responses/account/updateEmailConfirm');

var routes = [
    {
        method: 'DELETE',
        path: '/user',
        config: {
            handler: account.removeAccount,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            //response: { schema: removeAccountResponse },
            validate: {
                payload: {
                    password: Joi.string().min(5).max(30)
                }
            },
            description: 'Delete a user',
            notes: 'USER role required',
            tags: ['api']
        }
    },
    {
        method: 'POST',
        path: '/user',
        config: {
            handler: account.createAccount,
            description: 'Creates an account with the given email and password',
            notes: 'No authentication required.',
            tags: ['api'],
            //response: { schema: createAccountResponse },
            validate: {
                payload: {
                    email: Joi.string().email(),
                    password: Joi.string().min(5).max(30),
                    key: Joi.string()
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/user',
        config: {
            handler: account.getAccount,
            auth: 'feedient',
            cache: {
                privacy: 'private',
                expiresIn: 10 * 1000 // ExpireTime = 10 seconds
            },
            bind: { requiredRole: 'USER' },
            description: 'Gets the current user',
            notes: 'USER role required',
            tags: ['api'],
            //response: { schema: getAccountResponse },
        }
    },
    {
        method: 'GET',
        path: '/user/sessions',
        config: {
            handler: account.getSessions,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Gets the sessions for the current user',
            notes: 'USER role required',
            tags: ['api'],
        //    response: { schema: getSessionsResponse }
        }
    },
    {
        method: 'DELETE',
        path: '/user/session/{token}',
        config: {
            handler: account.removeSession,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Removes the session with the given token for the current user',
            notes: 'USER role required',
            tags: ['api'],
            //response: { schema: removeSessionResponse },
            validate: {
                params: {
                    token: Joi.string().required()
                }
            }
        }
    },
    {
        method: 'PUT',
        path: '/user',
        config: {
            handler: account.updateAccount,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Updates the current user',
            notes: 'USER role required',
            tags: ['api'],
            //response: { schema: updateAccountResponse }
        }
    },
    {
        method: 'POST',
        path: '/user/authorize',
        config: {
            handler: account.authorizeAccount,
            validate: {
                payload: {
                    email: Joi.string().required(),
                    password: Joi.string().required()
                }
            },
            description: 'Logs in the user with email and password',
            notes: 'No authorization required.',
            tags: ['api'],
            //response: { schema: authorizeAccountResponse }
        }
    },
    {
        method: 'GET',
        path: '/logout',
        config: {
            handler: account.logout,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Invalidates the current session.',
            notes: 'USER role required',
            tags: ['api'],
            //response: { schema: logoutResponse }
        }
    },
    {
        method: 'GET',
        path: '/user/key/{key}',
        config: {
            handler: account.generateInvitationKey,
            auth: 'feedient',
            bind: { requiredRole: 'ADMIN' },
            validate: {
                params: {
                    key: Joi.string().required()
                }
            },
            description: 'Generates an invitation key',
            notes: 'ADMIN role required',
            tags: ['api'],
            //response: { schema: generateInvitationKeyResponse }
        }
    },
    {
        method: 'POST',
        path: '/user/recover',
        config: {
            handler: mail.recoverPasswordConfirmEmail,
			validate: {
				payload: {
					email: Joi.string().required()
				}
			},
            description: 'Sends a recover email for the password to the given email.',
            notes: 'No authentication required.',
            tags: ['api'],
            //response: { schema: recoverPasswordConfirmEmailResponse }
        }
    },
    {
        method: 'GET',
        path: '/user/recover/{key}/',
        config: {
            handler: mail.recoverPasswordVerifyResetToken,
            validate: {
                query: {
                    email: Joi.string().required()
                },
                params: {
                    key: Joi.string().required()
                }
            },
            description: 'Sends an email with the new password if the given key is valid.',
            notes: 'No authentication required.',
            tags: ['api'],
            //response: { schema: recoverPasswordVerifyResetTokenResponse }
        }
    },
	{
		method: 'GET',
		path: '/user/confirm_email/{code}',
		config: {
			handler: account.updateEmailConfirm,
			auth: 'feedient',
            bind: { requiredRole: 'USER' },
			validate: {
				params: {
					code: Joi.string().required()
				}
			},
            description: 'Confirms the email update request.',
            notes: 'USER role required',
            tags: ['api'],
            //response: { schema: updateEmailConfirmResponse }
		}
	},
    {
        method: 'GET',
        path: '/user/refresh_providers',
        config: {
            handler: account.refreshProviders,
            auth: 'feedient',
            bind: { requiredRole: 'USER' },
            description: 'Updates the user\'s user providers details (example avatar)',
            notes: 'USER role required',
            tags: ['api']
        }
    }
];

module.exports.routes = function (server) {
    server.route(routes);
};
