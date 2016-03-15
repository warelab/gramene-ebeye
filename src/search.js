'use strict';

var grameneClient = require('gramene-search-client').client.grameneClient;
var Q = require('q');

function search(params) {
  return grameneClient.then(function(client) {
    var deferred = Q.defer();
    client['Search'].genes(params, deferred.resolve);
    return deferred.promise;
  });
}

module.exports = search;