'use strict';

var _ = require('lodash');

function translateResponseDocument(response) {
  var doc;

  if(!_.isObject(response)) {
    throw new Error("Response is not an object: " + response);
  }

  doc = response.obj;

  if (!_.isObject(doc)) {
    throw new Error("Doc is not an object: " + doc);
  }

  return {
    hitCount: getHitCount(doc),
    facets: [],
    entries: getEntries(doc)
  };
}

function getHitCount(doc) {
  return _.get(doc, 'response.numFound');
}

function getEntries(doc) {
  return _.get(doc, 'response.docs', []).map(function(result) {
    return {
      id: result.id,
      source: 'ensemblGenomes_gene',
      fields: result
    }
  });
}

module.exports = translateResponseDocument;