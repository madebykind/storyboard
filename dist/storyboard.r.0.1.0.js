/**
* Storyboard - v0.1.0 - 11/9/2015
* http://github.com/madebykind/storyboard
* Copyright (c) 2015 Alex Graul, Irene Ros, Rich Harris;
* Dual Licensed: MIT, GPL
* https://github.com/madebykind/storyboard/blob/master/LICENSE-MIT 
* https://github.com/madebykind/storyboard/blob/master/LICENSE-GPL 
*//**
* Storyboard - v0.1.0 - 11/9/2015
* http://github.com/madebykind/storyboard
* Copyright (c) 2015 Alex Graul, Irene Ros, Rich Harris;
* Dual Licensed: MIT, GPL
* https://github.com/madebykind/storyboard/blob/master/LICENSE-MIT 
* https://github.com/madebykind/storyboard/blob/master/LICENSE-GPL 
*//* global _ */

(function(global, _) {

  /**
   * Creates a new storyboard.
   *
   * @constructor
   * @name Storyboard
   *
   * @param {Object} [options]
   * @param {Object} [options.context] - Set a different context for the
   *                                     storyboard.  by default it's the scene
   *                                     that is being executed.
   */
  var Storyboard = function(options) {

    options = options || {};

    // Allow of scene methods across scenes
    if (_.isArray(options.extends)) {
      _.forEach(options.extends, function(obj) {
        _.extend(options, obj);
      });
    }

    // save all options so we can clone this later...
    this._originalOptions = options;

    // Set up the context for this storyboard. This will be
    // available as "this" inside the transition functions.
    this._context = options.context || this;

    // Assign custom id to the storyboard.
    this._id = _.uniqueId("scene");

    // If there are scenes defined, initialize them.
    if (options.scenes) {

      // if the scenes are actually just set to a function, change them
      // to an enter property
      _.each(options.scenes, function(scene, name) {
        if (typeof scene === "function") {
          options.scenes[name] = {
            enter : scene
          };
        }
      });

      // make sure enter/exit are defined as passthroughs if not present.
      _.each(Storyboard.HANDLERS, function(action) {
        options.scenes[action] = options.scenes[action] || function() { return true; };
      });

      // Convert the scenes to actually nested storyboards. A "scene"
      // is really just a storyboard of one action with no child scenes.
      this._buildScenes(options.scenes);

      // Save the initial scene that we will start from. When .start is called
      // on the storyboard, this is the scene we transition to.
      this._initial = options.initial;

      // Transition function given that there are child scenes.
      this.to = children_to;

    } else {

      // This is a terminal storyboad in that it doesn't actually have any child
      // scenes, just its own enter and exit functions.

      this.handlers = {};

      _.each(Storyboard.HANDLERS, function(action) {

        // save the enter and exit functions and if they don't exist, define them.
        options[action] = options[action] || function() { return true; };

        // wrap functions so they can declare themselves as optionally
        // asynchronous without having to worry about deferred management.
        this.handlers[action] = wrap(options[action], action);

      }, this);

      // Transition function given that this is a terminal storyboard.
      this.to = leaf_to;
    }


    // Iterate over all the properties defiend in the options and as long as they 
    // are not on a black list, save them on the actual scene. This allows us to define
    // helper methods that are not going to be wrapped (and thus instrumented with 
    // any deferred and async behavior.)
    _.each(options, function(prop, name) {

      if (_.indexOf(Storyboard.BLACKLIST, name) !== -1) {
        return;
      }

      if (_.isFunction(prop)) {
        this[name] = (function(contextOwner) {
          return function() {
            prop.apply(contextOwner._context || contextOwner, arguments);
          };
        }(this));
      } else {
        this[name] = prop;
      }

    }, this);

  };

  RSVP.EventTarget.mixin(Storyboard.prototype);

  Storyboard.HANDLERS = ["enter","exit"];
  Storyboard.BLACKLIST = ["_id", "initial","scenes","enter","exit","context","_current"];

  _.extend(Storyboard.prototype,
    /**
     * @lends Storyboard.prototype
     */
    {

    /**
     * Allows for cloning of a storyboard
     *
     * @returns {Storyboard}
     */
    clone : function() {

      // clone nested storyboard
      if (this.scenes) {
        _.each(this._originalOptions.scenes, function(scene, name) {
          if (scene instanceof Storyboard) {
            this._originalOptions.scenes[name] = scene.clone();
          }
        }, this);
      }

      return new Storyboard(this._originalOptions);
    },

    /**
     * Attach a new scene to an existing storyboard.
     *
     * @param {String} name - The name of the scene
     * @param {Storyboard} parent - The storyboard to attach this current
     *                                   scene to.
     */
    attach : function(name, parent) {

      this.name = name;
      this.parent = parent;

      // if the parent has a custom context the child should inherit it
      if (parent._context && (parent._context._id !== parent._id)) {

        this._context = parent._context;
        if (this.scenes) {
          _.each(this.scenes , function(scene) {
            scene.attach(scene.name, this);
          }, this);
        }
      }
      return this;
    },

    /**
     * Instruct a storyboard to kick off its initial scene.
     * If the initial scene is asynchronous, you will need to define a .then
     * callback to wait on the start scene to end its enter transition.
     *
     * @returns {Deferred}
     */
    start : function(argsArr) {
      argsArr = argsArr || [];
      argsArr.unshift(this._initial);

      // if we've already started just return a happily resoved deferred
      if (typeof this._current !== "undefined") {
        return RSVP.defer().resolve();
      } else {
        return this.to.apply(this, argsArr);
      }
    },


    /**
     * Move to the next logical step in the storyboard sequence
     */
    next: function() {
      return this._sequence('next');
    },

    /**
     * Move to the previous logical step in the storyboard sequence
     */
    prev: function() {
      return this._sequence('prev');
    },

    _sequence: function(dir, deferred) {
      var currentScene = this._current;
      var targetSceneName = currentScene[dir + "Scene"];


      function failed() {
        deferred = deferred || RSVP.defer();
        deferred.reject();
        return deferred.promise;
      }

      // if the current scene has children, walk through those first
      if (currentScene.scenes) {
        return currentScene[dir]();
      }

      // bail out if the currentScene doesn't have the requested sequence direction
      if (!targetSceneName) {
        return failed();
      }

      // go to the target if it exists
      if (this.scenes[targetSceneName]) {
        return this.to(targetSceneName, [], deferred);
      }

      // otherwise not look for it in the parent storyboard (if that exists)
      if ( this.parent && this.parent.scenes[targetSceneName] ) {
        return this.parent.to(targetSceneName, [], deferred);
      } else {

        // nope, really nothing matches
        return failed();
      }
    },


    /**
     * Cancels a transition in action. This doesn't actually kill the function
     * that is currently in play! It does reject the deferred one was awaiting
     * from that transition.
     */
    cancelTransition : function() {
      this._complete.reject();
      this._transitioning = false;
    },

    /**
     * Returns the current scene.
     *
     * @returns {String|null} current scene name
     */
    scene : function() {
      return this._current ? this._current.name : null;
    },

    /**
     * Checks if the current scene is of a specific name.
     *
     * @param {String} scene - scene to check as to whether it is the current
     *                         scene
     *
     * @returns {Boolean} true if it is, false otherwise.
     */
    is : function( scene ) {
      return (scene === this._current.name);
    },

    /**
     * @returns {Boolean} true if storyboard is in the middle of a transition.
     */
    inTransition : function() {
      return (this._transitioning === true);
    },

    /**
     * Allows the changing of context. This will alter what "this" will be set
     * to inside the transition methods.
     */
    setContext : function(context) {
      this._context = context;
      if (this.scenes) {
        _.each(this.scenes, function(scene) {
          scene.setContext(context);
        });
      }
    },

    _buildScenes : function( scenes ) {
      this.scenes = {};
      _.each(scenes, function(scene, name) {
        this.scenes[name] = scene instanceof Storyboard ? scene : new Storyboard(scene);
        this.scenes[name].attach(name, this);
      }, this);
    },
    deferred: function(){
      return RSVP.defer();
    }
  });

  // Used as the to function to scenes which do not have children
  // These scenes only have their own enter and exit.
  function leaf_to( sceneName, argsArr, deferred ) {
    this._transitioning = true;

    var complete = this._complete = deferred || RSVP.defer();
    var handlerComplete = RSVP.defer();

    var args = argsArr ? argsArr : [];

    var success = _.bind(function() {
      this._transitioning = false;
      this._current = sceneName;
      complete.resolve();
    }, this);

    var bailout = _.bind(function() {
      this._transitioning = false;
      complete.reject();
    }, this);

    handlerComplete.promise.then(success, bailout);

    this.handlers[sceneName].call(this._context, args, handlerComplete);
    window.returnedProm = complete.promise
    return complete.promise;
  }

    // Used as the function to scenes that do have children.
  function children_to( sceneName, argsArr, deferred ) {
    var toScene = this.scenes[sceneName];
    var fromScene = this._current;
    var args = argsArr ? argsArr : [];

    var complete = this._complete = deferred || RSVP.defer();
    var exitComplete = RSVP.defer();
    var enterComplete = RSVP.defer();

    var publish = _.bind(function(name, isExit) {

      var scene = isExit ? fromScene : toScene;
      var sceneName = scene ? scene.name : '';

      this.trigger(name, fromScene, toScene);

      if (name !== 'start' || name !== 'end') {
        this.trigger(sceneName + ":" + name);
      }

    }, this);

    var bailout = _.bind(function() {
      this._transitioning = false;
      this._current = fromScene;
      publish('fail');
      complete.reject();
    }, this);

    var success = _.bind(function() {
      publish("enter");
      this._transitioning = false;
      this._current = toScene;
      publish("end");
      complete.resolve();
    }, this);


    if (!toScene) {
      throw "Scene \"" + sceneName + "\" not found!";
    }

    // are we in the middle of a transition?
    if (this._transitioning) {
      complete.reject();
      return complete.promise;
    }

    publish("start");
    this._transitioning = true;

    if (fromScene) {

      // we are coming from a scene, so transition out of it.
      fromScene.to("exit", args, exitComplete).then(function() {
        publish('exit', true);
      });

    } else {

      // not coming from a scene, so resolve immediately
      exitComplete.resolve();
    }

    // when we're done exiting, enter the next set
    exitComplete.promise.then(function() {
      toScene.to(toScene._initial || "enter", args, enterComplete);
    }, bailout);

    enterComplete.promise.then(success, bailout);

    return complete.promise;
  }

  function wrap(func, name) {

    //don't wrap non-functions
    if ( !_.isFunction(func)) { return func; }
    //don't wrap private functions
    if ( /^_/.test(name) ) { return func; }
    //don't wrap wrapped functions
    if (func.__wrapped) { return func; }

    var wrappedFunc = function(args, deferred) {
      var async = false,
          result;

          deferred = deferred || RSVP.defer();

          this.async = function() {
            async = true;
            return function(pass) {
              return (pass !== false) ? deferred.resolve() : deferred.reject();
            };
          };

      result = func.apply(this, args);
      this.async = undefined;
      if (!async) {
        return (result !== false) ? deferred.resolve() : deferred.reject();
      }
      return deferred.promise;
    };

    wrappedFunc.__wrapped = true;
    return wrappedFunc;
  }

  global.Storyboard = Storyboard;

}(this, _));

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