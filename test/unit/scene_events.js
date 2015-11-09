/* global Storyboard,QUnit,_ */

QUnit.module("Storyboard Event Integration");

QUnit.test("Basic transition events", function(assert) {
  var testDone = assert.async();
  assert.expect(1);

  var events = [
    "start",
    "x:unloaded:enter",
    "enter",
    "unloaded:enter",
    "end",
    "start",
    "x:unloaded:exit",
    "exit",
    "unloaded:exit",
    "x:loaded:enter",
    "enter",
    "loaded:enter",
    "end",
    "start",
    "x:loaded:exit",
    "exit",
    "loaded:exit",
    "x:ending:enter",
    "enter",
    "ending:enter",
    "end"
  ];
  var actualEvents = [];

  var eventList = [
    "start","exit",
    "enter","end",
    "unloaded:enter", "unloaded:exit",
    "loaded:enter", "loaded:exit",
    "ending:enter", "ending:exit"
  ];


  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {
        enter : function() {
          actualEvents.push("x:unloaded:enter");
        },
        exit : function() {
          actualEvents.push("x:unloaded:exit");
        }
      },
      loaded : {
        enter : function() {
          actualEvents.push("x:loaded:enter");
        },
        exit : function() {
          actualEvents.push("x:loaded:exit");
        }
      },
      ending : {
        enter : function() {
          actualEvents.push("x:ending:enter");
        }
      }
    }
  });

  
  _.each(eventList, function(event) {
    app.on(event, function() {
      actualEvents.push(event);
    });
  });

  app.start()
  .then(function() {
    return app.to("loaded")
  })
  .then(function() {
    return app.to("ending")
  })
  .then(function() {
    assert.ok(_.isEqual(actualEvents, events), actualEvents);
    testDone();
  });

});
