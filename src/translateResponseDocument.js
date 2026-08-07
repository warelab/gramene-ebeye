'use strict';

var _ = require('lodash');
var FL = require('./translateRequestParams').FL.split(',');
var taxonomyLUT = require('./taxonomyLUT');

function translateResponseDocument(response) {
  var doc;

  if (!_.isObject(response)) {
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
  if (facetValues.length) {
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
  var facet = _.get(doc, 'facet_counts.facet_fields.taxon_id');

  return _.reduce(facet, function (acc, item, idx) {
    // deal with SOLR's [key1,val1,   key2,val2,   ...,   keyn,valuen] array structure.
    if (idx % 2 === 0) {
      // first the key
      acc.push({ label: taxonomyLUT.taxon_id2name[item], value: Math.floor(item/1000) });
    }
    else {
      // then the value;
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
  var species = taxonomyLUT.taxon_id2name[result.taxon_id];

  return {
    id: [result.id],
    name: [result.name + ' [' + result.id + ']'],
    description: [result.description],
    location: [result.region + ':' + result.start + '-' + result.end],
    species: [species],
    system_name: [result.system_name],
    database: [result.db_type],
    genetree: [result.gene_tree] || [],
    gene_synonym: (result.synonyms || []).concat(result.alt_id || []),

    // hardcoded
    transcript: [],
    genomic_unit: ['plants'],
    featuretype: ['Gene']

  };
}

// Fields in FL that are sparse in the index. Everything else in FL is on every gene doc, so a
// missing one means the core is malformed and is worth throwing over. Measured against
// sorghum_genes11 (5,407,132 docs): alt_id 107,226 · synonyms 34,576 · gene_tree 2,681,417 —
// vs id/name/description/region/start/end/system_name/db_type/taxon_id at 5,407,132 each.
// Anything added to FL must be considered here: alt_id was added to FL without being listed as
// optional, which made checkFields throw on the 98% of genes that have no alt id.
var OPTIONAL_FIELDS = ['gene_tree', 'synonyms', 'alt_id'];

function checkFields(doc) {
  FL.forEach(function (field) {
    if (OPTIONAL_FIELDS.indexOf(field) !== -1) return;

    if (!doc[field]) {
      throw new Error("Doc " + doc.id + " missing field " + field);
    }
  });
}

module.exports = translateResponseDocument;
