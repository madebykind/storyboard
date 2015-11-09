/* global module */

module.exports = function(grunt) {

  var fullBanner = "/**\n" +
                "* <%= pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today(\"m/d/yyyy\") %>\n" +
                "* <%= pkg.homepage %>\n" +
                "* Copyright (c) <%= grunt.template.today(\"yyyy\") %> <%= pkg.authors %>;\n" +
                "* Dual Licensed: <%= _.pluck(pkg.licenses, \"type\").join(\", \") %>\n" +
                "* https://github.com/madebykind/storyboard/blob/master/LICENSE-MIT \n" +
                "* https://github.com/madebykind/storyboard/blob/master/LICENSE-GPL \n" +
                "*/";

  grunt.initConfig({
    pkg : grunt.file.readJSON("package.json"),

    meta : {
      banner :  fullBanner,
      lastbuild : "<%= grunt.template.today(\"yyyy/mm/dd hh:ss\") %>"
    },

    node: {
      wrapper: "src/node/compat.js",
      storyboard: "dist/storyboard.<%= pkg.version %>.js"
    },

    concat : {
      options : {
        banner : fullBanner
      },

      fullnodeps: {
        dest: "dist/storyboard.<%= pkg.version %>.js",
        src: [
          "<%= meta.banner %>",
          "src/storyboard.js"
        ]
      },

      requirenodeps: {
        dest: "dist/storyboard.r.<%= pkg.version %>.js",
        src: [
          "<%= meta.banner %>",
          "dist/storyboard.<%= pkg.version %>.js",
          "src/require.js"
        ]
      },

      fulldeps: {
        dest : "dist/storyboard.deps.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "libs/lodash-compat.js",
          "libs/backbone-events-standalone.js",
          "libs/rsvp.js",
          "dist/storyboard.<%= pkg.version %>.js"
        ]
      },

      buildstatus : {
        options : {
          banner : "<%= grunt.template.today(\"yyyy/mm/dd hh:ss\") %>"
        },
        dest : "dist/LASTBUILD",
        src : [
          "<%= \"lastbuild\" %>"
        ]
      }
    },

    uglify : {
      options : {
        mangle : {
          except : [ "_", "$", "moment" ]
        },
        squeeze : {},
        codegen : {},
        banner : fullBanner
      },
      minnodeps : {
        dest : "dist/storyboard.min.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner >",
          "dist/storyboard.<%= pkg.version %>.js"
        ]
      },
      mindeps : {
        dest : "dist/storyboard.deps.min.<%= pkg.version %>.js",
        src : [
          "<%= meta.banner %>",
          "dist/storyboard.deps.<%= pkg.version %>.js"
        ]
      }
    },

    qunit : {
      all : {
        options : {
          urls : [
            "http://localhost:8001/test/index.html"
          ]
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          base: ".",
          keepalive:true
        }
      },
      qunit: {
        options: {
          port: 8001,
          base: "."
        }
      }
    },

    watch : {
      files : ["src/**/*.js", "test/unit/*.js"],
      tasks : ["jshint","connect:qunit","qunit"]
    },

    jshint : {
      options : {
        unused : true,
        devel : true,
        noempty : true,
        forin : false,
        evil : true,
        maxerr : 100,
        boss : true,
        curly : true,
        eqeqeq : true,
        immed : true,
        latedef : true,
        newcap : true,
        noarg : true,
        sub : true,
        undef : true,
        eqnull : true,
        browser : true,
        bitwise  : true,
        loopfunc : true,
        predef : [ "_", "require", "exports", "define" ]
      },
      globals : {
        QUnit : true,
        module : true,
        test : true,
        asyncTest : true,
        expect : true,
        ok : true,
        equals : true,
        equal : true,
        JSLitmus : true,
        start : true,
        stop : true,
        $ : true,
        strictEqual : true,
        raises : true
      }
    },

    files : [
      "src/require.js",
      "src/storyboard.js",
      "src/node/compat.js",
      "test/unit/**/*.js"
    ]

  });

  grunt.registerTask("node", function() {

    var nodeConfig = grunt.config("node");
    var read = grunt.file.read;

    var output = grunt.template.process(read(nodeConfig.wrapper), {
      data : {
        storyboard : read(grunt.template.process(nodeConfig.storyboard))
      }
    });

    // Write the contents out
    grunt.file.write("dist/node/storyboard.deps." +
      grunt.template.process(grunt.config("pkg").version) + ".js",
    output);
  });

  // load available tasks.
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-qunit");

  // Default task.
grunt.registerTask("default", ["jshint", "connect:qunit", "qunit", "concat", "uglify", "node"]);

grunt.registerTask("test", ["jshint", "connect:qunit", "qunit"]);
};

