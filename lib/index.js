"use strict";

var path = require('path');
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

    // To run specific tests, pass them along via command line.
    // @example	> node test fixtureA fixtureB ...
    //
    var tests = process.argv.splice(2);

    if(tests.length) {
        tests = tests.map(function(name) {
            return util.format(path.resolve(testDir) + '/%s/%s.js', specDir, name);
        });
    } else {
        // Otherwise, run them all
        //
        tests = glob.sync(path.resolve(testDir, specDir, '**/*.js'));
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
            return require(path)(t, Promise);
        });

    }, []);
};