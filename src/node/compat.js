var _ = require("lodash");
_.mixin(require("rsvp"));

<%= misoStoryboard %>

// Expose the module
module.exports = this.Miso;
