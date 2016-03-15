'use strict';

var _ = require('lodash');

const EXPECTED_FORMAT = 'json';
const EXPECTED_FIELDS = 'id,name,description,species,featuretype,location,genomic_unit,system_name,database,transcript,gene_synonym,genetree';
const EXPECTED_GENOMIC_UNIT = 'plants';
const FL = "id,name,description,taxon_id,region,start,end,system_name,db_type,genetree,synonyms";

function translateRequestParams(ensemblParams) {
  var ensemblQuery;

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

  if (!ensemblQuery.q || !ensemblQuery.species) {
    throw new Error("Did not find q param or species param. We need those.");
  }

  if (ensemblParams.format !== EXPECTED_FORMAT) {
    throw new Error("Not expecting a requested format of " + ensemblParams.format);
  }

  if (_.isString(ensemblParams.fields) && ensemblParams.fields !== EXPECTED_FIELDS) {
    throw new Error("Not expected fields parameter value to be " + ensemblParams.fields);
  }

  return {
    q: ensemblQuery.q,
    fl: FL,
    fq: 'system_name:' + speciesToSystemName(ensemblQuery.species),
    rows: ensemblParams.size,
    start: ensemblParams.start || 0
  };
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

function speciesToSystemName(species) {
  if (!_.isString(species)) {
    throw new Error("Supplied species is not a string: " + species);
  }
  return species.toLowerCase().replace(/ /g, '_');
}

translateRequestParams.FL = FL;

module.exports = translateRequestParams;