/* global Storyboard,QUnit,_ */

QUnit.module("Simple next / prev paging tests", {
  beforeEach: function() {
    app = new Storyboard({
      initial : "unloaded",
      scenes : {
        unloaded : {
          nextScene:  "loaded"
        },
        loaded : {
          prevScene:  "unloaded",
          nextScene:  "exit"
        },
        exit : {
          prevScene:  "loaded"
        }
      }
    });
  },
  afterEach: function() {
    app = null;
  }
});

QUnit.test("next() moves to the next logical scene", function(assert) {
  assert.expect(2);

  var testDone = assert.async();

  app.start()
  .then(function() {
    assert.ok(app.is('unloaded'), 'app in unloaded');
    return app.next();
  })
  .then(function(){
    assert.ok(app.is('loaded'), 'app is now next scene: loaded');
    testDone();
  });
});


QUnit.test("prev() moves to the previous logical scene", function(assert) {
  assert.expect(2);

  var testDone = assert.async();

  app.start()
  .then(function() {
    return app.to('exit');
  })
  .then(function(){
    assert.ok(app.is('exit'), 'app in exit');
    return app.prev();
  })
  .then(function(){
    assert.ok(app.is('loaded'), 'app is now in prev scene: unloaded');
    testDone();
  });
});



QUnit.test("calling next on a scene with no parent and which doesn't define a nextScene key rejects the promise", function(assert) {
  assert.expect(2);

  var testDone = assert.async();

  app.start()
  .then(function() {
    return app.to('exit');
  })
  .then(function() {
    assert.ok(app.is('exit'), 'app is in exit');
    return app.next();
  })
  .catch(function(){
    assert.ok(true, 'promise was rejected when nextScene is null');
    testDone();
  });
});

QUnit.test("calling prev on a scene with no parent and which doesn't define a prevScene key rejects the promise", function(assert) {
  assert.expect(2);

  var testDone = assert.async();

  app.start()
  .then(function() {
    assert.ok(app.is('unloaded'), 'app is unloaded');
    return app.prev();
  })
  .catch(function(){
    assert.ok(true, 'promise was rejected when prevScene is null');
    testDone();
  });
});

