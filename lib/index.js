"use strict";

var Path = require('path');
var fs = require('fs');
var util = require('util');
var glob = require('glob');
var test = require('blue-tape').test;
var harness = require('apt-tap');
var Promise = require('bluebird');

Promise.longStackTraces();

// @param opts {Object} Configuration options
// @param [opts.testDir]    The directory to run tests in. Should be absolute.
//                          Default process.cwd()
// @param [opts.specDir]    String name of folder under #testDir where test spec
//                          files are located. Default `spec`
// @param [opts.fixtureDir] String name of folder under #testDir where test fixture
//                          files are located. Default `fixture`
// @param [opts.reporter]   A string argument suitable for #require indicating where
//                          to find the TAP reporter suitable for @apt-tap.
//                          Default 'apt-tap-basic'
//
module.exports = function(opts) {

    var testDir = opts.testDir || process.cwd();
    var specDir = opts.specDir || 'spec';
    var fixtureDir = opts.fixtureDir || 'fixture';

    // If a non-reachable reporter is sent, unadorned TAP output will result
    // (apt-tap accepts a null argument as valid). So, it is ok to not
    // send a reporter simply by defining #reporter as anything other than undefined,
    // such as Boolean false.
    //
    var reporter;
    try {
        reporter = require(typeof opts.reporter !== 'undefined' ? opts.reporter : 'apt-tap-basic');
    } catch(e) {}

    // To run specific tests, pass them along via command line.
    // @example	> node test fixtureA fixtureB ...
    //
    var tests = process.argv.splice(2);

    if(tests.length) {
        tests = tests.map(function(name) {
            return util.format(Path.resolve(testDir) + '/%s/%s.js', specDir, name);
        });
    } else {
        // Otherwise, run them all
        //
        tests = glob.sync(Path.resolve(testDir, specDir, '**/*.js'));
    }

    // Tap into stream of tests, report, and pipe results to
    // any writable stream.
    //
    test
        .createStream()
        .pipe(harness(reporter))
        .pipe(process.stdout);

    Promise.reduce(tests, function(prev, path) {

        // test(path...)
        // The test file #path is used here as the test name.
        // You can change that to any other String you'd like.
        //
        return test(path, function(t) {

            var maybeFixturePath = Path.resolve(testDir, fixtureDir, Path.basename(path));
            var fixture = {};

            try {
                fixture = require(maybeFixturePath);
            } catch(e) {}

            return (require(path).bind(fixture))(t, Promise);
        });

    }, []);
};