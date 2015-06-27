var should        = require('should');
var msgFormatter  = require('../../src/lib/msgFormatter');

//function getMessage(request, type, message) {

describe('Message Formatter', function () {
    it('Setting the parameters to undefined for getMessage should return UNKNOWN_ERROR', function (done) {
        var msg = msgFormatter.getMessage(undefined);
        msg.should.equal('An unknown error has occurred.');
        done();
    });

    it('Setting the parameters to undefined for getError should return UNKNOWN_ERROR', function (done) {
        var msg = msgFormatter.getError(undefined, undefined, undefined);
        msg.should.have.property('error');
        msg.error.should.have.keys('message', 'type', 'code');
        msg.error.message.should.equal('An unknown error has occurred.');
        done();
    });

    it('Setting the parameters to garbage for getError should return garbage, this because it does not exist as a language', function (done) {
        var msg = msgFormatter.getError('garbage', 'garbage', 'garbage');
        msg.should.have.property('error');
        msg.error.should.have.keys('message', 'type', 'code');
        msg.error.type.should.equal('garbage');
        msg.error.message.should.equal('garbage');
        done();
    });

    it('Setting the parameters to "UNAUTHORIZED" for getError should return "You are not authorized to access this page."', function (done) {
        var msg = msgFormatter.getError('AuthException', 'UNAUTHORIZED', null);
        msg.should.have.property('error');
        msg.error.should.have.keys('message', 'type', 'code');
        msg.error.type.should.equal('AuthException');
        msg.error.message.should.equal('You are not authorized to access this page.');
        done();
    });

    it('Setting the parameters to "UNAUTHORIZED" for getMessage should return "You are not authorized to access this page."', function (done) {
        var msg = msgFormatter.getMessage('UNAUTHORIZED');
        msg.should.equal('You are not authorized to access this page.');
        done();
    });
});