/* global Storyboard,QUnit,_ */

QUnit.module("Asynchronous enter/exit tests");

QUnit.test("Attempting to start a second transition is rejected if one in progress", function(assert) {
  assert.expect(5);

  var testDone = assert.async();

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {}
    }
  });

  app.start().then(function() {
    var promise = app.to("loaded");

    assert.ok(app.is("unloaded"), "should still be unloaded during transition");
    assert.ok(app.inTransition(), "should be in transition");

    app.to("loaded").catch(function(){
      assert.ok(true, "attempt to start a second transition is rejected");
    });

    promise.then(function(){
      assert.equal(app.scene(), "loaded", "scene is now 'loaded'");

      assert.ok(!app.inTransition(), "app no longer in transition");
      testDone();
    });
  });
});

QUnit.test("Cancelling a transition in progress", function(assert) {
  assert.expect(4);
  var testDone = assert.async();

  var done;

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {}
    }
  });

  app.start().then(function() {

    var promise = app.to("loaded");

    assert.ok(app.inTransition(), "entered transition");

    promise.catch(function() {
      assert.ok(true, "transition promise rejected");
    });

    app.cancelTransition();

    assert.ok(!app.inTransition(), "no longer in transition");

    promise = app.to("loaded");

    promise.then(function() {
      assert.ok(true, "second attempt succeeds");
      testDone();
    });
  });
});


QUnit.test("async handlers are executed in the correct order", function(assert) {
  assert.expect(1);
  var testDone = assert.async();

  var order = [];
  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {
        exit: function() {
          var done = this.async();
          setTimeout(function() {
            order.push("a");
            done();
          }, 100);
        }
      },
      loaded : {
        enter : function() {
          order.push("b");
        }
      }
    }
  });

  app.start().then(function() {
    app.to("loaded");

    setTimeout(function() {
      assert.equal(order.join(""), "ab", "handlers fired in the corect order");
      testDone();
    }, 200);

  });
});


QUnit.test("async fail on enter stops transition", function(assert) {
  assert.expect(4);

  var testDone = assert.async();

  var pass;
  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {
        enter : function() {
          pass = this.async();
        }
      }
    }
  });

  app.start().then(function() {
    var promise = app.to("loaded");
    assert.ok(app.inTransition(), "app is in transition");

    // need to wait until loaded.enter has been called
    setTimeout(function(){
      continueTest();
    }, 1);


    function continueTest() {
      pass(false);

      promise.catch(function() {
        assert.ok(true, "passing false to this.async invocation in enter function cancels the transition");
        assert.ok(!app.inTransition(), "app is no longer transitioning");
        assert.equal(app.scene(), "unloaded", "app is still in 'unloaded' scene");
        testDone();
      });
    }
  });
});

QUnit.test("async fail on exit stops transition", function(assert) {
  var testDone = assert.async();
  assert.expect(4);

  var pass;
  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {
        exit : function() {
          pass = this.async();
        }
      },
      loaded : {}
    }
  });


  app.start().then(function() {
    var promise = app.to("loaded");
    assert.ok(app.inTransition(), "app is in transition before async fail");

    // need to wait until unloaded.exit has been called
    setTimeout(function(){
      continueTest();
    }, 1);

    function continueTest() {
      pass(false);

      promise.catch(function() {
        assert.ok(true, "passing false to this.async invocation in exit function cancels the transition");
        assert.ok(!app.inTransition(), "app no longer transitioning");
        assert.equal(app.scene(), "unloaded", "app is still in 'unloaded' scene");
        testDone();
      });
    }
  });
});

QUnit.test("passing a custom deferred to to()", function(assert) {
  assert.expect(1);

  var testDone = assert.async();

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {},
      loaded : {}
    }
  });

  app.start().then(function() {
    var done = app.deferred();

    done.promise.then(function() {
      assert.ok(true, "custom deferred is resolved by to()");
      testDone();
    });


    app.to("loaded", [], done);
  });
});
