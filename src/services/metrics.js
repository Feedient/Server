var msgFormatter = require('../lib/msgFormatter');

var Metrics = function() {

};

/**
 * Get the count from a metrics collection, with optional condition
 *
 * @api-method POST
 * @api-url    /metrics/count/f/{collection}/{conditions?}
 * @param      request
 * @return {array}
 */
exports.getCountFeeds= function(collection, conditions, collections, callback) {
    if (!collections[collection]) {
        return callback('errors.Collection not defined in Mongoose');
    }

    collections[collection].collection.count(conditions, function(err, count) {
        if (err) return callback(err);
        return callback(null, { count: count });
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
exports.getCountMetrics = function(collection, conditions, db, callback) {
    if (conditions && conditions.timestamp) {
        for (var i in conditions.timestamp) {
            conditions.timestamp[i] = new Date(conditions.timestamp[i]);
        }
    }

    db.collection(collection).count(conditions, function(err, count) {
        if (err) return callback(err);
        return callback(null, { count: count });
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
exports.getLast = function(collection, db, callback) {
    var cursor = db.collection(collection).find();
    cursor.sort({timestamp: -1});
    cursor.limit(1);

    cursor.toArray(function(err, object) {
        if (err) return callback(err);
        return callback(null, object[0]);
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
exports.getMetrics = function(db, collection, pTimeStart, pTimeEnd, pInterval, callback) {
    var timeStart = new Date(parseInt(pTimeStart));
    var timeEnd = (pTimeEnd) ? new Date(parseInt(pTimeEnd)) : new Date();
    var interval = parseInt(pInterval) || 1000;

    /**
     * We aggregate the results by the interval that we specified
     * The aggregate works as following: We group by where the value is equal to the given value and we return that
     * Example: group: someId ==> This returns the group where the id is equal to this.
     *
     * NOTE: We use { '$subtract': [{'$divide': ['timestamp', interval]}, {'$mod': [{'$divide': ['timestamp', interval]}, 1]}]}
     *       to calculate the interval value, and remove the decimal (round) since mongo does not provide a round() function.
     *
     * Formula used to calculate the interval: ( timestamp / INTERVAL - ( ( timestamp / INTERVAL ) mod 1 ) )
     */
    var map = function() {
        // Get the current timestamp, and remove the decimals, this is done by the | 0 which will threat it as a integer
        var time = (( this.timestamp.getTime() / 1000 / interval) | 0 );
        var hour = time * interval;

        // Group by hour, always 1 (1 is the value worth and we are counting metrics)
        emit(hour, 1);
    };

    var reduce = function(key, values) {
        var total = 0;

        for (var i in values) {
            total += parseInt(values[i]);
        }

        return total;
    };

    db.collection(collection)
      .mapReduce(
        map,
        reduce,
        {
            'query': {
                'timestamp': {
                    '$gte': timeStart,
                    '$lt': timeEnd
                }
            },
            'scope': { 'interval': interval },
            'out': { 'inline': 1 }
        },
        function (err, results) {
            if (err) return callback(err);
            return callback(null, { interval: interval, time_start: timeStart, time_end: timeEnd, results: results });
        });

    function sortAscending(a, b) {
        return b - a;
    }
};
