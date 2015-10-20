"use strict";

// Testing whether fixtures that return non-objects are correctly
// converted into objects w/ this filename as key
//
module.exports = function() {
    return 'globalB'
};