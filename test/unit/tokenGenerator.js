var should          = require('should');
var tokenGenerator  = require('../../src/lib/tokenGenerator');

describe('Token Generator', function () {
    it('2 newly generated strings should be different from each other', function (done) {
        tokenGenerator(20, function (string1) {
            tokenGenerator(20, function(string2) {
                string1.should.not.equal(string2);
                done();
            });
        });
    });
});