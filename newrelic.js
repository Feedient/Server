/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
    /**
     * Array of application names.
     */
    app_name : ['Feedient'],
    /**
     * Your New Relic license key.
     */
    license_key : 'NEW RELIC LICENSE KEY HERE',
    logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'info',
        filepath: require('path').join(process.cwd(), 'logs/newrelic_agent.log')
    },

    rules : {
        ignore : [
            '^/socket.io/\*/xhr-polling'
        ]
    }
};
