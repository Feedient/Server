var nodemailer      = require('nodemailer');
var fs              = require('fs');
var User            = require('../entities/user');
var msgFormatter    = require('../lib/msgFormatter');
var sha1 			= require('sha1');
var stringGenerator = require('../lib/stringGenerator');
var UserSession     = require('../entities/userSession');
var config          = require('../../config/app');

/**
 * Logs out the user, destroys the cookie for the current platform only
 */
exports.sendContactEmail = function(name, email, cause, message, callback) {
    // Create transport
    var transport = nodemailer.createTransport("SMTP", config.smtp);

    fs.readFile('src/views/emails/contact.html', 'utf-8', function(err, html) {
        var causes = {
            CONTACT_CAUSE_SUPPORT: 'Support Request',
            CONTACT_CAUSE_OTHER: 'Other',
            CONTACT_CAUSE_PRESS: 'Press Inquiry',
            CONTACT_CAUSE_BUGS: 'Bug Report'
        };

        // Set the subject of the mail
        var subject = "[Feedient Contact] " + causes[cause] + " from " + name;

        // Render the view
        html = html.replace(/\{\{name\}\}/, name);
        html = html.replace(/\{\{email\}\}/, email);
        html = html.replace(/\{\{cause\}\}/, cause);
        html = html.replace(/\{\{message\}\}/, message);
        html = html.replace(/\{\{subject\}\}/, subject);

        // Prepare the email
        var mailOptions = {
            from: name + " <no-reply@feedient.com>",
            replyTo: email,
            to: "contact@feedient.com",
            subject: subject,
            text: 'Name: ' + name + '\nEmail: ' + email + '\nMessage: ' + message,
            html: html
        };

        // Send mail
        transport.sendMail(mailOptions, function(err, response) {
            if (err) return callback(err);

            // Cleanup
            transport.close();

            // Return success
            return callback(null, { success: true, response: response });
        });
    });
};

exports.recoverPasswordConfirmEmail = function(email, callback) {
    // If the user exists, then send a confirmationemail
    User.findByEmail(email, function(err, user) {
        if (err) return callback(err);
        if (!user) return callback('errors.ACCOUNT_NOT_FOUND');

        // Set recover key
        user.recoverKey = sha1(stringGenerator(10));

        user.save(function(err) {
            if (err) return callback(err);

            // Create transport
            var transport = nodemailer.createTransport("SMTP", config.smtp);

            fs.readFile('src/views/emails/password_1.html', 'utf-8', function(err, html) {
	        var subject = "Recover your Feedient password";
                var link = config.client.url + "recover?key=" + user.recoverKey + "&email=" + user.email;

                // Super basic view renderer...
                html = html.replace(/\{\{title\}\}/g, subject);
                html = html.replace(/\{\{link\}\}/g, link);

                var mailOptions = {
                    from: "Feedient <no-reply@feedient.com>", // sender address
                    to: user.email, // list of receivers
                    subject: subject, // Subject line
                    text: 'You have requested to reset your Feedient.com password, please visit this link to proceed: ' + link, // plaintext body
                    html: html // html body
                };

                // Send mail
                transport.sendMail(mailOptions, function(err, response) {
		    if (err) return callback(err);

                    // Cleanup
                    transport.close();

                    // Return success
                    return callback(null, { success: true, response: response });
                });
            });
        });
    });
};

exports.recoverPasswordVerifyResetToken = function(email, key, callback) {
    // Check the key and email
    User.findByEmail(email, function(err, user) {
        if (err) return callback(err);
        if (user.recoverKey != key) return callback('errors.ACCOUNT_RECOVER_WRONG_KEY');

        // Set password, empty recoverkey, inc recovercount
        var newPassword = stringGenerator(7);
        user.password = newPassword;
        user.recoverCount++;
        user.recoverKey = "";

        user.save(function(err) {
            if (err) return callback(err);

            // Create transport
            var transport = nodemailer.createTransport("SMTP", config.smtp);

            fs.readFile('src/views/emails/password_2.html', 'utf-8', function(err, html) {
                var subject = "Your new Feedient password";

                // Super basic view renderer...
                html = html.replace(/\{\{title\}\}/g, subject);
                html = html.replace(/\{\{newPassword\}\}/g, newPassword);

                // Send mail
                transport.sendMail({
                    from: "Feedient <no-reply@feedient.com>", // sender address
                    to: user.email, // list of receivers
                    subject: subject, // Subject line
                    text: "Your new Feedient.com password is: " + newPassword, // plaintext body
                    html: html // html body
                }, function(err, response) {
                    if (err) return callback(err);

                    // Cleanup
                    transport.close();

                    // Delete all the tokens, password changed!
                    UserSession.removeByUserId(user._id, function(err) {
                        if (err) return callback(err);

                        // Return success
                        return callback(null, { success: true, response: response });
                    });
                });
            });
        });
    });
};
