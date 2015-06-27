'use strict';

exports.getRoutes = function (request, reply) {
    var routes = request.server._router.routes;
    var get_methods     = (routes.get) ? _processRoutes(routes.get) : [];
    var post_methods    = (routes.post) ? _processRoutes(routes.post) : [];
    var put_methods     = (routes.put) ? _processRoutes(routes.put) : [];
    var delete_methods  = (routes.delete) ? _processRoutes(routes.delete) : [];

    return reply({
        get: get_methods,
        post: post_methods,
        put: put_methods,
        delete: delete_methods
    });
};

var _processRoutes = function(routes) {
    var result = [];

    for (var route in routes) {
        var currentRoute = routes[route].settings;

        var resultRoute = {
            auth: {
                strategies: currentRoute.strategies
            },
            method: currentRoute.method,
            path: currentRoute.path,
            parameters: {
                path: _processPathParameters(currentRoute),
                query: _processQueryParameters(currentRoute),
                payload: _processPayloadParameters(currentRoute)
            }
        };

        if (currentRoute.bind && currentRoute.bind.requiredRole) resultRoute.auth.requiredRole = currentRoute.bind.requiredRole;

        result.push(resultRoute);
    }

    return result;
}

var _processPathParameters = function(route) {
    var pathParameters = [];

    for (var pathKey in route.validate.path) {
        pathParameters.push({
            name: pathKey,
            type: route.validate.path[pathKey]._type
        });
    }

    return pathParameters;
};

var _processQueryParameters = function(route) {
    var queryParameters = [];

    for (var queryKey in route.validate.query) {
        queryParameters.push({
            name: queryKey,
            type: route.validate.query[queryKey]._type
        });
    }

    return queryParameters;
};

var _processPayloadParameters = function(route) {
    var payloadParameters = [];

    for (var payloadKey in route.validate.payload) {
        payloadParameters.push({
            name: payloadKey,
            type: route.validate.payload[payloadKey]._type
        });
    }

    return payloadParameters;
};
