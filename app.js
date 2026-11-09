'use strict';

const DEFAULT_PORT = 11070;

// Public swagger spec URL. swagger-client fetches the spec here, then builds
// API request URLs from the spec's own host/schemes/basePath (data.sorghumbase.org,
// https, /sorghum_v11). Both the spec fetch and the API calls go over real TLS,
// so no EPROTO. For purely local testing point this at http://localhost:50011/...
// AND set host: localhost:50011 + http in swagger.yaml so the schemes match.
global.gramene = {defaultServer: "https://data.gramene.org/v70/swagger"};

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

// Fail a request without taking the process down.
//
// This service is a thin translator over the EBI REST API and gramene's own swagger, and nearly
// every one of its failure modes used to be fatal -- which is how the v4 instance reached 862 pm2
// restarts. Express DOES catch a synchronous throw inside a handler (verified: a
// genomic_unit:protists query returns 500 and the process survives), so the loud
// "genomic_unit should be plants" stack in the logs is not what was killing it. Express cannot
// see these three, and all three were reachable here:
//   - a rejected promise with no .catch        -> unhandledRejection, fatal on node >= 15
//   - a throw inside an async callback         -> uncaughtException
//   - an 'error' event on a stream being piped -> uncaughtException
function fail(res, where, err) {
  console.error('ebeye ' + where + ': ', (err && err.stack) || err);
  if (!res.headersSent) {
    res.status(502).json({error: 'upstream request failed'});
  }
}

app.get('/ensemblGenomes_variant', function(req, res, next) {
  console.log("Hitting ensemblGenomes_variant", req.query);
  request.get({url:ebeye_rest+'/ensemblGenomes_variant',qs:req.query}, function(err, response, body) {
    // Was `return` with no response, leaving the client hanging until it timed out.
    if (err) { return fail(res, 'variant upstream', err); }
    try {
      // Threw on any non-JSON body -- an EBI error page is HTML -- and this is an async
      // callback, so the throw went straight past Express and killed the process.
      var responseObj = JSON.parse(response.body);
      if (responseObj.entries) {
        responseObj.entries.forEach(function(hit) {
          // associated_gene is absent on some hits; .length on undefined was also fatal here.
          var genes = hit.fields && hit.fields.associated_gene;
          if (genes && genes.length === 1) {
            hit.fields.associated_gene = genes[0].split(',');
          }
        });
        res.json(responseObj);
      }
      else {
        res.send(response.body)
      }
    }
    catch (e) { fail(res, 'variant parse', e); }
  });
});
app.get('/ensemblGenomes_genome', function(req, res, next) {
  console.log("Hitting ensemblGenomes_genome", req.query);
  // Without the 'error' listener an unreachable upstream emits 'error' on this stream
  // with nobody listening, which node raises as an uncaught exception.
  request.get({url:ebeye_rest+'/ensemblGenomes_genome',qs:req.query})
    .on('error', function (err) { fail(res, 'ensemblGenomes_genome upstream', err); })
    .pipe(res);
});
app.get('/ensemblGenomes_seqregion', function(req, res, next) {
  console.log("Hitting ensemblGenomes_seqregion", req.query);
  // Without the 'error' listener an unreachable upstream emits 'error' on this stream
  // with nobody listening, which node raises as an uncaught exception.
  request.get({url:ebeye_rest+'/ensemblGenomes_seqregion',qs:req.query})
    .on('error', function (err) { fail(res, 'ensemblGenomes_seqregion upstream', err); })
    .pipe(res);
});

app.get('/ensemblGenomes_gene', function (req, res, next) {
  console.log("Hitting ensemblGenomes_gene", req.query);
  // translateRequestParams throws synchronously for a bad query and Express handles that, but
  // the chain below needed its own catch: grameneClient rejects when the swagger spec at
  // global.gramene.defaultServer is unreachable (the documented startup crash-loop), and
  // translateResponseDocument throws when the response shape is unexpected. Either was fatal.
  search(translateRequestParams(req.query))
    .then(translateResponseDocument)
    .then(function (formattedResponseDoc) {
      res.json(formattedResponseDoc);
    })
    .catch(function (err) { fail(res, 'gene', err); });
});

// Answer errors as JSON, not Express's default HTML, since every route here serves JSON.
// Must come after the routes.
app.use(function (err, req, res, next) {
  console.error('ebeye request error: ', (err && err.stack) || err);
  if (!res.headersSent) {
    res.status(500).json({error: String((err && err.message) || err)});
  }
});

// Last resort. A promise rejection nobody caught terminates node >= 15 by default; the handlers
// above cover the known paths, and this keeps a future one from handing pm2 another restart.
// Deliberately NOT paired with an uncaughtException handler: continuing after one of those means
// serving from unknown state, and the throws that used to cause them are fixed at source above.
process.on('unhandledRejection', function (err) {
  console.error('ebeye unhandledRejection (request dropped, process kept alive): ', (err && err.stack) || err);
});

app.listen(port, function () {
  console.log('CORS-enabled web server listening on port ' + port);
});
