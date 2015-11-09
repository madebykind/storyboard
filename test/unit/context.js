/* global Storyboard,QUnit,_ */

QUnit.module("Context and arguments");

QUnit.test("extending a scene with additional methods", function(assert) {
  assert.expect(1);
  var testDone = assert.async();

  var done = false;
  var app = new Storyboard({
    boom : function() {
      done = true;
    },
    enter : function() {
      this.boom();
    }
  });

  app.to("enter")
  .then(function(){
    assert.equal(done, true, "additional method is available in scene enter()");
    testDone();
  });
});

QUnit.test("handlers can access arguments passed to transition", function(assert) {
  assert.expect(4);
  var testDone = assert.async();

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {
        exit : function(a, b) {
          assert.equal(a, 44);
          assert.equal(b.power, "full");
        }
      },
      loaded : {
        enter : function(a, b) {
          assert.equal(a, 44);
          assert.equal(b.power, "full");
        }
      }
    }
  });

  app.start()
  .then(function() {
    return app.to("loaded", [44, { power : "full" }]);
  })
  .then(function(){
    testDone();
  });

});

QUnit.test("Applying a context to a simple scene", function(assert) {
  var testDone = assert.async();
  assert.expect(2);

  var context = {
    a : true,
    b : 96
  };

  var app = new Storyboard({
    context : context,
    initial : "unloaded",
    scenes : {
      unloaded : {
        enter : function() {
          assert.equal(this.a, true);
          assert.equal(this.b, 96);
        }
      }
    }
  });
  app.start().then(function(){
    testDone();
  });

});

QUnit.test("Applying a context to a simple scene and then switching it", function(assert) {
  var testDone = assert.async();
  assert.expect(6);

  var context1 = {
    a : true,
    b : 96
  };

  var context2 = {
    a : false,
    b : 1
  };

  var app = new Storyboard({
    context : context1,
    initial : "c1",
    scenes : {
      c1 : {
        enter : function() {
          assert.equal(this.a, true);
          assert.equal(this.b, 96);
        },
        exit : function() {
          assert.equal(this.a, false);
          assert.equal(this.b, 1);
        }
      },
      c2 : {
        enter : function() {
          assert.equal(this.a, false);
          assert.equal(this.b, 1);
        },
        exit : function() {
          testDone();
        }
      },
      end : {}
    }
  });

  app.start()
  .then(function(){
    app.setContext(context2);
  })
  .then(function() {
    return app.to("c2")
  })
  .then(function() {
    return app.to("end");
  })

});

QUnit.test("applying a context to nested rigs", function(assert) {
  assert.expect(4);
  var testDone = assert.async();

  var context = {
    a : true,
    b : 96
  };

  var app = new Storyboard({
    context : context,
    initial : "unloaded",
    scenes : {
      unloaded : {
        enter : function() {
          assert.equal(this.a, true);
          assert.equal(this.b, 96);
        },
        exit : function() {
          assert.equal(this.a, true);
          assert.equal(this.b, 96);
        }
      },
      loaded : {}
    }
  });

  app.start()
  .then(function() {
    return app.to("loaded");
  })
  .then(function(){
    testDone();
  });

});

