/* global exports,define,module */
(function(global) {

  var Storyboard = global.Storyboard || {};
  delete window.Storyboard;

  // CommonJS module is defined
  if (typeof exports !== "undefined") {
    if (typeof module !== "undefined" && module.exports) {
      // Export module
      module.exports = Storyboard;
    }
    exports.storyboard = Storyboard;

  } else if (typeof define === "function" && define.amd) {
    // Register as a named module with AMD.
    define("Storyboard", [], function() {
      return Storyboard;
    });
  }
}(this));