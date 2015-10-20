"use strict";

module.exports = function(test, Promise) {

    test.equal(this.fixtureKey, 'globalFixtures', 'globalFixtures spec fixture was correctly assigned');

    test.equal(this.globalAKey, 'globalA', 'Global fixture (A) was correctly assigned');

    test.equal(this.globalB(), 'globalB', 'Global fixture (B) was converted from Function to Object with correct key');

    return Promise.resolve();
};