var should          = require('should');
var stringGenerator = require('../../src/lib/stringGenerator');

describe('String Generator', function () {
    it('The length of the generated string should be the given length', function (done) {
        var string1 = stringGenerator(20);
        string1.length.should.equal(20);
        var string2 = stringGenerator(20);
        string2.length.should.equal(20);
        done();
    });

    it('2 newly generated strings should be different from each other', function (done) {
        var string1 = stringGenerator(20);
        var string2 = stringGenerator(20);

        string1.should.not.equal(string2);
        done();
    });

    it('A generated string should have the right characters', function (done) {
        var string = stringGenerator(20);
        string.should.match(/^[-_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890]+$/);
        done();
    });
});