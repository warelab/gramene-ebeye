'use strict';

const DEFAULT_PORT = 11057;

global.gramene = {defaultServer: "http://data.gramene.org/v57/swagger"};

var ebeye_rest = 'https://www.ebi.ac.uk/ebisearch/ws/rest';
var test = 'https://www.ebi.ac.uk/ebisearch/ws/rest?format=json&size=0&query=ENSVATH00125659%20AND%20genomic_unit:plants'
require('./src/taxonomyLUT'); // warm this up prior to first use, hopefully.

var express = require('express')
  , cors = require('cors')
  , search = require('./src/search.js')
  , translateRequestParams = require('./src/translateRequestParams')
  , translateResponseDocument = require('./src/translateResponseDocument')
  , app = express()
  , port = process.env.PORT || DEFAULT_PORT
  , request = require('request');

app.use(cors());

app.get('/ensemblGenomes_variant', function(req, res, next) {
  console.log("Hitting ensemblGenomes_variant", req.query);
  request.get({url:ebeye_rest+'/ensemblGenomes_variant',qs:req.query}, function(err, response, body) {
    if(err) { console.log(err); return; }
    var responseObj = JSON.parse(response.body);
    if (responseObj.entries) {
      responseObj.entries.forEach(function(hit) {
        if (hit.fields.associated_gene.length === 1) {
          hit.fields.associated_gene = hit.fields.associated_gene[0].split(',');
        }
      });
      res.json(responseObj);
    }
    else {
      res.send(response.body)
    }
  });
});
app.get('/ensemblGenomes_genome', function(req, res, next) {
  console.log("Hitting ensemblGenomes_genome", req.query);
  request.get({url:ebeye_rest+'/ensemblGenomes_genome',qs:req.query}).pipe(res);
});
app.get('/ensemblGenomes_seqregion', function(req, res, next) {
  console.log("Hitting ensemblGenomes_seqregion", req.query);
  request.get({url:ebeye_rest+'/ensemblGenomes_seqregion',qs:req.query}).pipe(res);
});

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
