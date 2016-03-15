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
    expect(function () {translateRequestParams({query:'genomic_unit:plants', size:'0'})}).toThrow(new Error("Did not find q param or species param. We need those."));
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants AND species:elephant', size:'0'})}).toThrow(new Error("Not expecting a requested format of undefined"));
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants AND species:elephant', size:'0', format:'foo'})}).toThrow(new Error("Not expecting a requested format of foo"));
    expect(function () {translateRequestParams({query:'foo AND genomic_unit:plants AND species:elephant', size:'0', format:'json'})}).not.toThrow();
  });
});