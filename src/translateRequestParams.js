'use strict';

var _ = require('lodash');
var taxonomyLUT = require('./taxonomyLUT');

const EXPECTED_FORMAT = 'json';
const EXPECTED_FIELDS = 'id,name,description,species,featuretype,location,genomic_unit,system_name,database,transcript,gene_synonym,genetree';
const EXPECTED_GENOMIC_UNIT = 'plants';
const FL = "id,name,description,taxon_id,region,start,end,system_name,db_type,gene_tree,synonyms";

function translateRequestParams(ensemblParams) {
  var ensemblQuery, result;

  if (!_.isObject(ensemblParams)) {
    throw new Error('ensemblParams should be an object! It is ' + ensemblParams);
  }

  if( !ensemblParams.query || !ensemblParams.size) {
    throw new Error("Expected params `query` or `size` not found");
  }

  if(!ensemblParams.size.match(/^\d+$/)) {
    throw new Error("size should be an unpadded positive integer, but it's " + ensemblParams.size)
  }

  ensemblQuery = processEnsemblQueryString(ensemblParams.query);

  if (ensemblQuery.genomic_unit !== EXPECTED_GENOMIC_UNIT) {
    throw new Error("genomic_unit should be plants; instead it's " + ensemblQuery.genomic_unit);
  }

  if (!ensemblQuery.q) {
    throw new Error("Did not find q param. We need that one.");
  }

  if (ensemblParams.format !== EXPECTED_FORMAT) {
    throw new Error("Not expecting a requested format of " + ensemblParams.format);
  }

  if (_.isString(ensemblParams.fields) && ensemblParams.fields !== EXPECTED_FIELDS) {
    throw new Error("Not expected fields parameter value to be " + ensemblParams.fields);
  }

  result = {
    q: ensemblQuery.q,
    fl: FL,
    rows: ensemblParams.size,
    start: ensemblParams.start || 0
  };

  if(ensemblQuery.species) {
    result.fq = 'taxon_id:' + taxonomyLUT.name2taxon_id[ensemblQuery.species];
  }

  if(ensemblParams.facetcount && ensemblParams.facetcount > 0) {
    result['facet.field'] = "{!facet.limit='#' facet.mincount='1' key='taxon_id'}taxon_id"
      .replace('#', ensemblParams.facetcount);
  }

  return result;
}

function processEnsemblQueryString(qs) {
  if (!qs) {
    throw new Error("Supplied ensembl query string is falsey");
  }

  return _(qs.split(' AND '))
    .map(processEnsemblQueryTerm)
    .keyBy('field')
    .mapValues('value')
    .value();
}

function processEnsemblQueryTerm(term) {
  var split = term.split(':');
  switch (split.length) {
    case 1:
      return {field: 'q', value: term};
    case 2:
      return {field: split[0], value: split[1]};
    default:
      throw new Error("Unexpected number of items from split of " + term);
  }
}

translateRequestParams.FL = FL;

module.exports = translateRequestParams;