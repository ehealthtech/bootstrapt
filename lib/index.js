"use strict";

var Path = require('path');
var fs = require('fs');
var util = require('util');
var glob = require('glob');
var test = require('blue-tape').test;
var harness = require('apt-tap');
var Promise = require('bluebird');
var _ = require('lodash');

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
// @param [opts.globalFixtures] An Array of fixtures that should wrap every test.
//
module.exports = function(opts) {

    var testDir = opts.testDir || process.cwd();
    var specDir = opts.specDir || 'spec';
    var fixtureDir = opts.fixtureDir || 'fixture';
    var globalFixtures = _.isArray(opts.globalFixtures) ? opts.globalFixtures : [];

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

    // Grab the requested fixture and merge into #into
    //
    function tryToMergeFixture(into, fromPath, test, isGlobal) {

        var fixture = {};
        var filename = Path.basename(fromPath, '.js');
        var f;

        try {
            f = require(fromPath);

            // Ensure that the fixture is an object. When not an object,
            // an object is created with the key of the fixture filename
            // with its extension stripped.
            //
            if(!_.isPlainObject(f)) {

                fixture[filename] = f;

            } else {

                fixture = f;
            }

            into = _.merge(into, fixture);

        } catch(err) {

            // If a requested global fixture was not found, report that.
            // "local" fixtures don't necessarily exist for all spec files
            // so not found errors are ok.
            //
            if(isGlobal) {
                test.fail(util.format('Unable to load global fixture [%s] -> %s', filename, err.message));
            }
        }
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

            var fixture = {};

            // Merge the requested global fixtures.
            //
            globalFixtures.forEach(function(gf) {
                tryToMergeFixture(fixture, Path.resolve(testDir, fixtureDir, gf), t, true);
            });

            // Merge the test-specific fixture, if any.
            //
            tryToMergeFixture(fixture, Path.resolve(testDir, fixtureDir, Path.basename(path)), t);

            return (require(path).bind(fixture))(t, Promise);
        });

    }, []);
};