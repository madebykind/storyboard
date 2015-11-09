/* global Storyboard,QUnit,_ */

var app;

QUnit.module("base", {
  beforeEach: function() {
    app = new Storyboard({
      counter : 0,
      initial : "a",
      scenes : {
        a : {
          enter : function(assert) {
            this.counter = 0;
          },
          exit : function(assert) {
            this.helper();
            assert.ok(this.counter === 1, "a counter is 1");
          },
          helper : function() {
            this.counter++;
            this.parent.helper();
          }
        },

        b : {
          enter : function(assert) {
            this.counter = 0;
          },
          exit : function(assert) {
            this.helper();
            assert.ok(this.counter === 1, "b counter is 1");
          },
          helper : function() {
            this.counter++;
            this.parent.helper();
          }
        },

        ending : {}
      },

      helper : function() {
        this.counter += 10;
      }
    });
  },
  afterEach: function() {
    app = null;
  }
});

QUnit.test("Function only scenes", function(assert) {
  var testDone = assert.async();
  var step;

  assert.expect(1);
  
  var nums = [];
  var sb = new Storyboard({
    initial : "a",
    scenes: {
      a : function() {
        nums.push(1);
      },
      b : function() {
        nums.push(2);
      },
      c : function() {
        nums.push(3);
      },
      d : {
        enter : function() {
          nums.push(4);
        }
      }
    }
  });
  
  sb.start()
  .then(function() {
    return sb.to("b");
  })
  .then(function() {
    return sb.to("c");
  })
  .then(function() {
    return sb.to("d")
  })
  .then(function() {
    assert.ok(_.isEqual(nums, [1,2,3,4]), "nums are equal");
    testDone();
  });
});

QUnit.test("Create storyboard", function(assert) {
  var testDone = assert.async();
  assert.expect(3);
  
  app.start()
  .then(function() {
    return app.to("b", [assert]);
  })
  .then(function() {
    return app.to("ending", [assert]);
  })
  .then(function() {
    assert.ok(app.counter === 20, app.counter);
    testDone();
  });

});

QUnit.test("Cloning", function(assert) {
  var done1 = assert.async();
  var done2 = assert.async();

  assert.expect(6);

  app.start()
  .then(function() {
    return app.to("b",[assert]);
  })
  .then(function() {
    return app.to("ending", [assert]);
  })
  .then(function() {
    assert.ok(app.counter === 20, app.counter);
    return done1();
  });

  var app2 = app.clone();
  
  // counter now starts at 20!
  app2.start()
  .then(function() {
    return app2.to("b",[assert]);
  })
  .then(function() {
    return app2.to("ending", [assert]);
  })
  .then(function() {
    assert.ok(app2.counter === 20, app2.counter);
    return done2();
  });
});

QUnit.test("Cloning deeply", function(assert) {
  var done1 = assert.async();
  var done2 = assert.async();

  assert.expect(6);

  var app = new Storyboard({
    counter : 0,
    initial : "a",
    scenes : {
      a : new Storyboard({
        enter : function() {
          this.counter = 0;
        },
        exit : function(assert) {
          this.helper();
          assert.ok(this.counter === 1, "a counter is 1");
        },
        helper : function() {
          this.counter++;
          this.parent.helper();
        }
      }),
      b : {
        enter : function() {
          this.counter = 0;
        },
        exit : function(assert) {
          this.helper();
          assert.ok(this.counter === 1, "b counter is 1");
        },
        helper : function() {
          this.counter++;
          this.parent.helper();
        }
      },
      ending : {}
    },
    helper : function() {
      this.counter += 10;
    }
  });

  app.start()
  .then(function() {
    return app.to("b", [assert]);
  })
  .then(function() {
    return app.to("ending", [assert]);
  })
  .then(function() {
    assert.ok(app.counter === 20, app.counter);
    return done1();
  });

  var app2 = app.clone();

  // counter now starts at 20!
  app2.start().then(function() {
    return app2.to("b", [assert]);
  })
  .then(function() {
    return app2.to("ending", [assert]);
  })
  .then(function() {
    assert.ok(app2.counter === 20, app2.counter);
    return done2();
  });
});