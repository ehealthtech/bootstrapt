"use strict";

module.exports = function(test, Promise) {

    test.equal(1,1);
    test.notEqual(1,0);

    test.equal(this.fixtureKey, 'nopromise', 'Fixture was correctly assigned');

    return Promise.resolve();
};