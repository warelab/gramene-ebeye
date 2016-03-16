# maizev4-search
This software is a web service that furnishes the temporary [B73 ensembl core](http://maizev4.gramene.org) with search results. It acts as an intermediary between the Ensembl instance and an instance of [gramene-swagger](warelab/gramene-swagger) with the correct genomes loaded into it (which may be found [here](http://devdata.gramene.org/zm4/v50/docs/?url=/v50/zm4/swagger)).

This repo is using Travis CI for testing (though tests are limited to unit tests of the code that tranliterates between Ensembl and the web service). Current status: ![Current Status](https://travis-ci.org/warelab/maizev4-search.svg?branch=master)
