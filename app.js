'use strict';

const DEFAULT_PORT = 11011;

var express = require('express')
  , cors = require('cors')
  , search = require('./src/search.js')
  , translateRequestParams = require('./src/translateRequestParams')
  , app = express()
  , port = process.env.PORT || DEFAULT_PORT;

app.use(cors());

app.get('/ensemblGenomes_gene', function(req, res, next){
  console.log("Hitting ensemblGenomes_gene", req.query);
  search(translateRequestParams(req.query)).then(function(results) {
    res.json(results.obj);
  });
});

app.listen(11011, function(){
  console.log('CORS-enabled web server listening on port ' + port);
});