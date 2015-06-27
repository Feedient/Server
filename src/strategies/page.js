var async = require('async');

function PagesAPI() {
    this.name = 'PagesAPI';
};

PagesAPI.prototype.use = function(strategy) {
    this.strategy = strategy;
};

PagesAPI.prototype.getPages = function(userProvider, pageCallback) {
    var self = this;

    async.waterfall([
        // Get Pages
        function(callback){
            self.strategy.getPages(userProvider, function(err, pages) {
                if (err) return callback(err);
                return callback(null, pages);
            });
        },
        // Process pages through their processPage algorithm
        function(pages, callback) {
            if (!pages) return callback("Pages is undefined");
            // Process all notifications
            async.map(pages, function(page, cb) {
                if (!page) return cb(null, null);
                var transformedPage = self.processPage(page, userProvider);
                return cb(null, transformedPage);
            }, function(err, transformedPages) {
                if (err) return callback(err);
                return callback(null, transformedPages);
            });
        },
        // Remove pages that are null
        function(pages, callback) {
            async.filter(pages, function(page, cb) {
                if (page == null || undefined) return cb(false);
                return cb(true);
            }, function(pages) {
                return callback(null, pages);
            });
        },
    ],
    // optional callback
    function(err, pages){
        if (err) return pageCallback(err);

        // Sort the posts descending
        pages = pages.sort(function(a, b) {
            return new Date(b.created_time) - new Date(a.created_time)
        });

        // Return the posts
        return pageCallback(null, pages);
    });
};

PagesAPI.prototype.processPage = function(page, userProvider) {
    return this.strategy.processPage(page, userProvider);
};

module.exports = PagesAPI;
