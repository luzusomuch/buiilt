var pkg = require('./package.json');

module.exports = function(grunt) {
  // load all grunt tasks
  require('load-grunt-tasks')(grunt, {
    scope: 'devDependencies',
    config : './package.json'
  });

  grunt.initConfig({
    clean: {
      before:{
        src:[
          './client/dist/*.js',
          './client/dist/*.html',
          './client/dist/*.css',
          './client/temp'
        ]
      },
      after: {
        src:['./client/temp']
      }
    },
    dom_munger:{
      appBefore : {
        options : {
          prefix : [
            { selector : 'link[href]', attribute : 'href', value : './client' },
            { selector : 'script[src]', attribute : 'src', value : './client' }
          ]
        },
        src:'./client/app/index.html',
        dest: './client/temp/app.index.prepared.html'
      },
      app: {
        options: {
          remove: ['script[data-remove!="false"]','link[data-remove!="false"]'],
          read:[
            {selector:'script[data-concat!="false"]',attribute:'src',writeto:'appjs'},
            {selector:'link[rel="stylesheet"][data-concat!="false"]',attribute:'href',writeto:'appcss'}
          ],
          append: [
            {selector:'body',html:'<script src="/app.full.min.js"></script>'},
            {selector:'head',html:'<link rel="stylesheet" href="/app.full.min.css">'}
          ]
        },
        src:'./client/temp/app.index.prepared.html',
        dest: './client/temp/app.index.html'
      }
    },
    less: {
      development: {
        options: {
          paths: ['./client/assets/less'],
          sourceMap: true
        },
        files: {'./client/dist/app.full.css': './client/assets/less/main.less'}
      },
      deploy: {
        options: {
          paths: ['./client/assets/less'],
          compress: true
        },
        files: {'./client/dist/app.full.css': './client/assets/less/main.less'}
      }
    },
    cssmin: {
      dist: {
        files: {
          './client/temp/app.full.min.css' : ['<%= dom_munger.data.appcss %>', './client/dist/app.full.css']
        }
      }
    },
    replace : {
      dist : {
        options : {
          patterns : [
            {
              match : /(\.\.)?\/fonts\//ig,
              replacement : '/assets/fonts/'
            }
          ]
        },
        files : [
          { dest : './client/dist/app.full.min.css', src : ['./client/temp/app.full.min.css'] }
        ]
      }
    },
    copy : {
      js : {
        expand : true,
        cwd : './client/bower_components/jquery/dist/',
        src : 'jquery.min.map',
        dest : './client/dist/'
      },
      faFonts : {
        expand : true,
        src : '*',
        cwd : './client/bower_components/font-awesome/fonts/',
        dest : './client/assets/fonts/'
      },
      bootstrapFonts : {
        expand : true,
        src : '*',
        cwd : './client/bower_components/bootstrap/fonts/',
        dest : './client/assets/fonts/'
      },
      uiGridFonts : {
        expand : true,
        src : ['*.woff', '*.eot', '*.ttf', '*.svg'],
        cwd : './client/bower_components/angular-ui-grid/',
        dest : './client/assets/fonts/'
      },
      views: {
        expand : true,
        dot: true,
        src : [
         '**/*.html'
        ],
        cwd : './client/app',
        dest : './client/dist/app/'
      },
      imgAssets: {
        expand : true,
        dot: true,
        src : [
         '**/*.*'
        ],
        cwd : './client/assets/img',
        dest : './client/dist/assets/img/'
      }
    },
    ngtemplates: {
      app: {
        options: {
          module: pkg.name,
          htmlmin:'<%= htmlmin.main.options %>',
          prefix: '/'
        },
        src: ['./client/app/**.html', '!./client/app/index.html'],
        dest: './client/temp/templates.js'
      }
    },
    concat: {
      main : {
        files : {
          './client/temp/app.full.js' : ['<%= dom_munger.data.appjs %>','<%= ngtemplates.app.dest %>']
        }
      }
    },
    ngAnnotate: {
      options: {
        singleQuotes: true,
      },
      app: {
        src:'./client/temp/app.full.js',
        dest: './client/temp/app.full.js'
      }
    },
    uglify: {
      main: {
        files : {
          './client/dist/app.full.min.js' : './client/temp/app.full.js'
        }
      }
    },
    htmlmin: {
      main: {
        options: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true
        },
        files: {
          './client/dist/index.html' : './client/temp/app.index.html'
        }
      }
    },
    nodemon: {
      deploy: {
        script: 'server',
        options: {
          cwd: __dirname,
          ignore: ['node_modules/**', 'client/bower_components/**'],
          ext: 'js,html,css'
        }
      }
    }
  });

  grunt.registerTask('test', []);
  grunt.registerTask('build', [
    'clean:before',
    'dom_munger',
    'less:deploy', 'cssmin', 'replace',
    'copy',
    //'ngtemplates',
    'concat',
    'ngAnnotate',
    'uglify',
    'htmlmin',
    'clean:after'
  ]);

  grunt.registerTask('deploy', [
    'nodemon'
  ]);

  grunt.registerTask('default', [
    'clean:before',
    'dom_munger',
    'less:development', 'cssmin', 'replace',
    'copy',
    'ngtemplates',
    'concat',
    'ngAnnotate',
    'uglify',
    'htmlmin',
    'clean:after',
    'nodemon'
  ]);
};