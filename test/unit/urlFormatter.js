var should        = require('should');
var urlFormatter  = require('../../src/lib/urlFormatter');

describe('URL Formatter', function () {
    it('{test:test} should return test=test', function (done) {
        var serialized = urlFormatter.serialize({ test: 'test' });
        serialized.should.equal("test=test");
        done();
    });

    it('{test:test, test2:test2} should return test=test&test2=test2', function (done) {
        var serialized = urlFormatter.serialize({ test: 'test', test2: 'test2' });
        serialized.should.equal("test=test&test2=test2");
        done();
    });

    it('{} should return an empty string', function (done) {
        var serialized = urlFormatter.serialize({});
        serialized.should.equal('');
        done();
    });
});