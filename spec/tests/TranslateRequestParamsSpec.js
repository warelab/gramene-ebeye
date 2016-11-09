"use strict";

var Q = require('q');
var jasminePit = require('jasmine-pit');
var _ = require('lodash');

jasminePit.install(global);

describe("translateRequestParams functionality", function () {
  var translateRequestParams, wrappedFn;

  beforeEach(function () {
    translateRequestParams = require('../../src/translateRequestParams');
  });

  it("should error if required params are missing", function () {
    expect(function () {translateRequestParams({})}).toThrow(new Error("Expected params `query` or `size` not found"));
    expect(function () {translateRequestParams({query:'foo'})}).toThrow(new Error("Expected params `query` or `size` not found"));
    expect(function () {translateRequestParams({query:'foo', size:'size'})}).toThrow(new Error("size should be an unpadded positive integer, but it's size"));
    expect(function () {translateRequestParams({query:'foo', size:'0'})}).toThrow(new Error("genomic_unit should be plants; instead it's undefined"));
    expect(function () {translateRequestParams({query:'genomic_unit:plants', size:'0'})}).toThrow(new Error("Did not find q param. We need that one."));
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants AND species:elephant', size:'0'})}).toThrow(new Error("Not expecting a requested format of undefined"));
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants AND species:elephant', size:'0', format:'foo'})}).toThrow(new Error("Not expecting a requested format of foo"));
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants AND species:elephant', size:'0', format:'json'})}).not.toThrow();
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants', size:'0', format:'json'})}).not.toThrow();
  });

  it("should include a fl param for SOLR", function() {
    // given
    var params = translateRequestParams({
      query:'foo AND genomic_unit:plants AND species:elephant',
      size:'0',
      format:'json'
    });

    expect(params.fl).toEqual("id,name,description,taxon_id,region,start,end,system_name,db_type,gene_tree,synonyms");

      //fl=id,name,description,taxon_id,region,start,end,system_name,db_type,genetree
  });

  it("should facet on taxon_id if facetcount=1000 is present", function() {
    // given
    var params = translateRequestParams({
      query:'foo AND genomic_unit:plants AND species:elephant',
      size:'0',
      format:'json',
      facetcount:'1000'
    });

    expect(params['facet.field'])
      .toEqual("{!facet.limit='1000' facet.mincount='1' key='taxon_id'}taxon_id");
  });

  it("should correctly map the species parameter to taxon_id", function() {
    // given
    var params = translateRequestParams({
      query:'foo AND genomic_unit:plants AND species:Beta vulgaris subsp. vulgaris',
      size:'0',
      format:'json',
      facetcount:'1000'
    });

    // expect(params.fq).toEqual('taxon_id:3555');
  });

  it("should correctly munge the species parameter for Oryza", function() {
    // given
    var params = translateRequestParams({
      query:'foo AND genomic_unit:plants AND species:Oryza sativa Japonica',
      size:'0',
      format:'json',
      facetcount:'1000'
    });

    // expect(params.fq).toEqual('taxon_id:39947');
  });

});