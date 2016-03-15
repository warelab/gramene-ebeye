"use strict";

var Q = require('q');
var searchFixtures = require('../support/v50search.json');
var jasminePit = require('jasmine-pit');
var _ = require('lodash');

jasminePit.install(global);

describe("translateRequestParams functionality", function () {
  var translateResponseDocument, countFixture, resultsFixture;

  beforeEach(function () {
    var fixtures = require('../support/v50search.json');
    translateResponseDocument = require('../../src/translateResponseDocument');
    countFixture = fixtures.pad_norows;
    resultsFixture = fixtures.pad_rows;
  });

  it("should error if doc is missing", function () {
    expect(function () {translateResponseDocument()}).toThrow(new Error("Response is not an object: undefined"));
    expect(function () {translateResponseDocument({})}).toThrow(new Error("Doc is not an object: undefined"));
  });

  it("should get get an object back", function () {
    // given
    var formattedResponse = translateResponseDocument(countFixture);

    // then
    expect(formattedResponse).toBeDefined();
  });

  it("should get a hit count", function () {
    // given
    var formattedResponse = translateResponseDocument(countFixture);

    // then
    expect(formattedResponse.hitCount).toEqual(countFixture.obj.response.numFound);
  });

  it("should get an empty facets array", function () {
    // given
    var formattedResponse = translateResponseDocument(countFixture);

    // then
    expect(formattedResponse.facets).toEqual([]);
  });

  it("should get an empty entries array when requesting a count", function () {
    // given
    var formattedResponse = translateResponseDocument(countFixture);

    // then
    expect(formattedResponse.entries).toEqual([]);
  });

  it("should get an entries array when requesting results", function () {
    // given
    var formattedResponse = translateResponseDocument(resultsFixture);

    // then
    expect(formattedResponse.entries).toEqual(jasmine.any(Array));
  });

  it("should get as many results as requested", function () {
    // given
    var expectedResultCount = _.get(resultsFixture, 'obj.response.docs.length');
    var formattedResponse = translateResponseDocument(resultsFixture);

    // then
    expect(formattedResponse.entries.length).toEqual(expectedResultCount);
  });

  it('Results should contain the expected keys', function () {
    // given
    var firstResult = _.get(translateResponseDocument(resultsFixture), 'entries[0]');

    expect(firstResult.id).toBeDefined();
    expect(firstResult.source).toEqual('ensemblGenomes_gene');
    expect(firstResult.fields).toEqual(jasmine.any(Object));
  });

  it('Each result should contain the expected field keys', function () {
    // given
    var secondResultFields = _.get(translateResponseDocument(resultsFixture), 'entries[1].fields');

    expect(secondResultFields).toBeDefined();
    expect(_.size(secondResultFields)).toEqual(12);
    expect(secondResultFields).toEqual({
      "id": [
        "AT3G06820"
      ],
      "name": [
        "BRCC36B [AT3G06820]"
      ],
      "description": [
        "Mov34/MPN/PAD-1 family protein"
      ],
      "species": [
        "arabidopsis_thaliana" // not converting system_name for now
      ],
      "featuretype": [
        "Gene"
      ],
      "location": [
        "3:2150847-2153440"
      ],
      "genomic_unit": [
        "plants"
      ],
      "system_name": [
        "arabidopsis_thaliana"
      ],
      "database": [
        "core"
      ],
      "transcript": [], // nope
      "gene_synonym": [
        "AtBRCC36B"
      ],
      "genetree": []
    });
  });
});