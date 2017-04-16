'use strict';

const DEFAULT_PORT = 11053;

global.gramene = {defaultServer: "http://data.gramene.org/v53/swagger"};

require('./src/taxonomyLUT'); // warm this up prior to first use, hopefully.

var express = require('express')
  , cors = require('cors')
  , search = require('./src/search.js')
  , translateRequestParams = require('./src/translateRequestParams')
  , translateResponseDocument = require('./src/translateResponseDocument')
  , app = express()
  , port = process.env.PORT || DEFAULT_PORT;

app.use(cors());

app.get('/ensemblGenomes_gene', function (req, res, next) {
  console.log("Hitting ensemblGenomes_gene", req.query);
  search(translateRequestParams(req.query))
    .then(translateResponseDocument)
    .then(function (formattedResponseDoc) {
      res.json(formattedResponseDoc);
    });
});

app.listen(port, function () {
  console.log('CORS-enabled web server listening on port ' + port);
});