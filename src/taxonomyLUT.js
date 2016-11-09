'use strict';

var grameneClient = require('gramene-search-client').client.grameneClient;
var _ = require('lodash');

var lut = {
  name2taxon_id: {},
  taxon_id2name: {}
};

grameneClient.then(function(client) {
  client['Data access'].taxonomy({subset:'gramene', rows: -1, fl: '_id,name'}, function(taxonResponse) {
    taxonResponse.obj.forEach(x => {
      lut.name2taxon_id[x.name] = x._id;
      lut.taxon_id2name[x._id] = x.name;
    });
  });
});

module.exports = lut;