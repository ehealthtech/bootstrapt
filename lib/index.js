"use strict";

var Path = require('path');
var fs = require('fs');
var util = require('util');
var glob = require('glob');
var test = require('blue-tape').test;
var harness = require('apt-tap');
var reporter = require('apt-tap-basic');
var Promise = require('bluebird');

Promise.longStackTraces();

module.exports = function(opts) {

    var testDir = opts.testDir || process.cwd();
    var specDir = opts.specDir || 'spec';
    var fixtureDir = opts.fixtureDir || 'fixture';

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