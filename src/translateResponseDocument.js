'use strict';

var _ = require('lodash');
var FL = require('./translateRequestParams').FL.split(',');

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
    facets: getFacets(doc),
    entries: getEntries(doc)
  };
}

function getHitCount(doc) {
  return _.get(doc, 'response.numFound');
}

function getFacets(doc) {
  var facetValues = getSystemNameFacetValues(doc);
  if(facetValues.length) {
    return [
      {
        id: 'TAXONOMY',
        label: 'Organisms',
        total: facetValues.length,
        facetValues: facetValues
      }
    ]
  }
  else {
    return [];
  }
}

function getSystemNameFacetValues(doc) {
  var facet = _.get(doc, 'facet_counts.facet_fields.system_name');

  return _.reduce(facet, function(acc, item, idx) {
      if(idx % 2 === 0) {
        acc.push({label: item, value: item});
      }
      else {
        _.last(acc).count = item;
      }
      return acc;
    }, []);
}

function getEntries(doc) {
  return _.get(doc, 'response.docs', []).map(translateResult);
}

function translateResult(result) {
  checkFields(result);

  return {
    id: result.id,
    source: 'ensemblGenomes_gene',
    fields: translateFields(result)
  }
}

function translateFields(result) {
  return {
    id: [result.id],
    name: [result.name + ' [' + result.id + ']'],
    description: [result.description],
    location: [result.region + ':' + result.start + '-' + result.end],
    species: [result.system_name],
    system_name: [result.system_name],
    database: [result.db_type],
    genetree: result.genetree ? [result.genetree] : [],
    gene_synonym: result.synonyms || [],

    // hardcoded
    transcript: [],
    genomic_unit: ['plants'],
    featuretype: ['Gene']

  };
}

function checkFields(doc) {
  FL.forEach(function(field) {
    // it's optional.
    if(field === 'genetree' || field === 'synonyms') return;

    if(!doc[field]) {
      throw new Error("Doc " + doc.id + " missing field " + field);
    }
  });
}

module.exports = translateResponseDocument;