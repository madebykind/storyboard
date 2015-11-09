/* global Storyboard,QUnit,_ */

QUnit.module("Building complex scenes");

QUnit.test("scenes names get set when they're attached", function(assert) {

  assert.expect(1);

  var myStoryboard = new Storyboard({});
  var app = new Storyboard({
    initial : "base",
    scenes : { base : myStoryboard }
  });

  assert.equal(app.scenes["base"].name, "base");
});

QUnit.test("predefining scenes", function(assert) {

  var testDone = assert.async();
  assert.expect(1);

  var order = [];
  var sceneA = new Storyboard({
    enter : function() {
      order.push("a");
    },
    exit : function() {
      order.push("b");
    }
  });

  var sceneB = new Storyboard({
    enter : function() {
      order.push("c");
    }
  });

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : sceneA,
      loaded : sceneB
    }
  });

  app.start().then(function() {
    return app.to("loaded");
  })
  .then(function() {
    assert.equal(order.join(""), "abc");
    testDone();
  });
});

QUnit.test("Using as engine as a scene", function(assert) {
  var testDone = assert.async();
  assert.expect(1);

  var order = [];
  var subStoryboard = new Storyboard({
    scenes : {
      enter : {
        enter : function() {
          order.push("a");
        },
        exit : function() {
          order.push("b");
        }
      },
      exit : {
        enter : function() {
          order.push("c");
        }
      }
    },
    defer : true,
    initial : "enter"
  });

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : subStoryboard,
      loaded : {
        enter : function() {
          order.push("d");
        }
      }
    }
  });

  app.start().then(function() {
    return app.to("loaded");
  })
  .then(function(){
    assert.equal(order.join(""), "abcd");
    testDone();
  });

});


QUnit.test("Nesting 3 engines inside each other", function(assert) {
  var testDone = assert.async();
  assert.expect(1);

  var order = [];

  var inner = new Storyboard({
    initial : "enter",
    scenes : {
      enter : {
        enter : function() {
          order.push("c");
        }
      }
    },
    defer : true
  });

  var outer = new Storyboard({
    initial : "enter",
    scenes : {
      enter : {
        enter : function() {
          order.push("b");
        }
      },
      exit : inner
    },
    defer : true
  });

  var app = new Storyboard({
    initial : "a",
    scenes : {
      a : {
        enter : function() {
          order.push("a");
        }
      },
      b : outer,
      c : {}
    }
  });

  app.start()
  .then(function() {
    return app.to("b");
  })
  .then(function(){
    return app.to("c");
  })
  .then(function(){
    assert.equal(order.join(""), "abc");
    testDone();
  });
});

QUnit.test("applying a context to nested rigs", function(assert) {
  var testDone = assert.async();
  assert.expect(6);

  var context = {
    a : true,
    b : 96
  };

  var app = new Storyboard({
    context : context,
    initial : "unloaded",
    assert: assert,
    scenes : {
      unloaded : {
        enter : function() {
          app.assert.equal(this.a, true);
          app.assert.equal(this.b, 96);
        },
        exit : function() {
          app.assert.equal(this.a, true);
          app.assert.equal(this.b, 96);
        }
      },

      loaded : new Storyboard({
        initial : "enter",
        scenes : {

          enter : {
            enter : function() {
              app.assert.equal(this.a, true, "true in nested scene");
              app.assert.equal(this.b, 96, "true in nested scene");
            }
          },

          exit : {}

        }
      })
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

QUnit.test("nesting with defaulted scene definitions on children", function(assert) {
  var testDone = assert.async();

  var order = [
    "unloaded:enter",
    "loading:files",
    "loading:templates",
    "something:enter"
  ];
  var actualOrder = [];

  var loading = new Storyboard({
    initial : "files",
    scenes : {
      files : {
        enter : function() {
          actualOrder.push("loading:files");
        }
      },
      templates : {
        enter : function() {
          actualOrder.push("loading:templates");
        }
      }
    }
  });

  var app = new Storyboard({
    initial : "unloaded",
    scenes : {
      unloaded : {
        enter: function() {
          actualOrder.push("unloaded:enter");
        }
      },
      loaded : loading,
      something : {
        enter : function() {
          actualOrder.push("something:enter");
        }
      }
    }
  });

  app.start()
  .then(function() {
    return app.to("loaded");
  })
  .then(function() {
    return loading.to("templates");
  })
  .then(function() {
    return app.to("something");
  })
  .then(function(){
    assert.equal(order.join(""), actualOrder.join(""));
    testDone();
  });

});