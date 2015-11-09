/* global Storyboard,QUnit */

QUnit.module("Synchronous enter/exit Tests");

QUnit.test("Changing states", function(assert) {
  var testDone = assert.async();

  assert.expect(2);

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {}
    }
  });

  app.start()
  .then(function() {
    assert.equal(app.scene(), "unloaded", "initial state is unloaded");
    return app.to("loaded");
  })
  .then(function() {
    assert.ok(app.is("loaded"), "changed state is loaded");
    testDone();
  });

});

QUnit.test("Changing between multiple states", function(assert) {
  var testDone = assert.async();

  assert.expect(4);

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {},
      drilldown : {}
    }
  });

  app.start().then(function() {
    assert.ok(app.is("unloaded"), "initial state is unloaded");
    return app.to("loaded");
  })
  .then(function(){
    assert.ok(app.is("loaded"), "state is loaded");
    return app.to("drilldown");
  })
  .then(function(){
    assert.ok(app.is("drilldown"), "state is drill");
    return app.to("loaded");
  })
  .then(function(){
    assert.ok(app.is("loaded"), "state is loaded");
    testDone();
  });
});

QUnit.test("returning false on enter stops transition", function(assert) {
  var testDone = assert.async();

  assert.expect(2);

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {
        enter : function() {
          return false;
        }
      }
    }
  });

  app.start()
  .then(function() {
    return app.to("loaded");
  })
  .catch(function() {
    assert.ok(true, "promise rejected");
    assert.equal(app.scene(), "unloaded", "scene still unloaded");
    testDone();
  });
});

QUnit.test("returning false on exit stops transition", function(assert) {
  var testDone = assert.async();

  assert.expect(2);

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      loaded : {},
      unloaded : {
        exit : function() {
          return false;
        }
      }
    }
  });

  app.start()
  .then(function() {
    return app.to("loaded");
  })
  .catch(function() {
    assert.ok(true, "promise rejected");
    assert.equal(app.scene(), "unloaded", "scene still unloaded");
    testDone();
  });
});


QUnit.test("returning undefined on enter or exit does not cause a failure", function(assert) {
  var testDone = assert.async();

  assert.expect(1);

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {
        exit : function() {}
      },
      loaded : {
        enter : function() {}
      }
    }
  });

  app.start()
  .then(function() {
    return app.to("loaded");
  })
  .then(function() {
    assert.equal(app.scene(), "loaded");
    testDone();
  });
});