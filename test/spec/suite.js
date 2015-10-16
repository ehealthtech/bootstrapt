"use strict";

module.exports = function(test, Promise) {

    return Promise.resolve()
    .then(function() {

        test.equal(1,1);
        test.notEqual(1,0);

    });
};