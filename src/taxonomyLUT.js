'use strict';

var grameneClient = require('gramene-search-client').client.grameneClient;
var _ = require('lodash');

var lut = {};

grameneClient.then(function(client) {
  client['Data access'].maps({rows: -1, fl: 'db,taxon_id,system_name'}, function(mapsResponse) {
    var genomes, taxonIdsList;
    genomes = _.keyBy(mapsResponse.obj, 'system_name');
    taxonIdsList = mapsResponse.obj.map(function(map) { return map.taxon_id }).join(',');
    client['Data access'].taxonomy({idList: taxonIdsList, fl: '_id,name'}, function(taxonResponse) {
      var species, lutVals;
      species = _.keyBy(taxonResponse.obj, '_id'); // _id is taxon_id
      lutVals = _.mapValues(genomes, function(genome) {
        genome.name = species[genome.taxon_id].name;
        return genome;
      });
      _.assign(lut, lutVals);
    });
  });
});

module.exports = lut;