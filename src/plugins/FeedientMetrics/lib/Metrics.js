'use strict';

var dgram 			= require('dgram');

// ====================================================
// CONSTRUCTOR
// ====================================================
function Metrics(host, port, enabled) {
    this.enabled = enabled;
    this.host = host || '127.0.0.1';
    this.port = (port < 66536) ? port : 8881 || 8881;
}

// ====================================================
// CLASS METHODS
// ====================================================
/**
 * Increment is used to say that we got an increment going on, example: user registration
 * @param  {String} table The table to save to
 * @param  {String} value 
 * @return {sendMessage} Send the msg through udp
 */
Metrics.prototype.increment = function (table, value) {
    var message = new Buffer('c|' + table + '|' + (value || 1));
	return this.sendMessage(message);
};

/**
 * Tick is used to say that we ticked a function call, example: we ticked the forgotpassword call
 * @param  {String} table The table to save to
 * @param  {String} value 
 * @return {sendMessage} Send the msg through udp
 */
Metrics.prototype.tick = function(table, value) {
	var message = new Buffer('t|' + table + '|' + (value || 1));
	return this.sendMessage(message);
};

/**
 * Send a message
 */
Metrics.prototype.sendMessage = function (message) {
    var self = this;
	process.nextTick(function() {
        // If enabled, send the message else destroy it
        if (self.enabled) {
            var udpSocket = dgram.createSocket('udp4');
            udpSocket.send(message, 0, message.length, self.port, self.host, function (err, bytes) {
                udpSocket.close();   
                
                // Cleanup the buffer
                message = null;
            });
        } else {
            message = null;    
        }
	});
};

// ====================================================
// EXPORT
// ====================================================
module.exports = Metrics;