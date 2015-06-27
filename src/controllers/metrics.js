var Metrics = require('../services/metrics');

/**
 * Get the count from a metrics collection, with optional condition
 *
 * @api-method POST
 * @api-url    /metrics/count/f/{collection}/{conditions?}
 * @param      request
 * @return {array}
 */
exports.getCountFeeds= function(request, reply) {
    var collection = request.params.collection;
    var conditions = (request.params.conditions) ? JSON.parse(request.params.conditions) : {};
    var collections = request.server.plugins.FeedientMongoose.collections;

    Metrics.getCountFeeds(collection, conditions, collections, function(err, result) {
        if (err) return reply({ error: err });
        return reply(result);
    });
};

/**
 * Get the count from a feeds collection, with optional condition
 *
 * @api-method POST
 * @api-url    /metrics/count/m/{collection}/{conditions?}
 * @param      request
 * @return {array}
 */
exports.getCountMetrics = function(request, reply) {
    var collection = request.params.collection;
    var conditions = (request.params.conditions) ? JSON.parse(request.params.conditions) : {};
    var db = request.server.plugins.FeedientMongoDB;

    Metrics.getCountMetrics(collection, conditions, db, function(err, result) {
        if (err) return reply({ error: err });
        return reply(result);
    });
};

/**
 * Get the last object from a metrics collection
 *
 * @api-method POST
 * @api-url    /metrics/last/{collection}
 * @param      request
 * @return {array}
 */
exports.getLast = function(request, reply) {
    var collection = request.params.collection;
    var db = request.server.plugins.FeedientMongoDB;

    Metrics.getLast(collection, db, function(err, result) {
        if (err) return reply({ error: err });
        return reply(result);
    });
};

/**
 * Get the metrics for the defined collection starting from the
 * start_time and ending on the end_time by the specified interval
 *
 * @api-method POST
 * @api-url    /metrics/{collection}
 * @api-body   start_time
 * @api-body   end_time
 * @api-body   interval
 *
 * @param      request
 * @return {array}
 */
exports.getMetrics = function(request, reply) {
    var db = request.server.plugins.FeedientMongoDB;
    var collection = request.params.collection;
    var timeStart = request.query.start_time;
    var timeEnd = request.query.end_time;
    var interval = request.query.interval;

    Metrics.getMetrics(db, collection, timeStart, timeEnd, interval, function(err, result) {
        if (err) return reply({ error: err });
        return reply(result);
    });
};
