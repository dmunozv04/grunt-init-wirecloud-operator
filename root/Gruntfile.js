/*
 * {%= name %}
 * {%= homepage %}
 *
 * Copyright (c) {%= grunt.template.today('yyyy') %} {%= vendor_title %}
 * Licensed under the {%= licenses.join(', ') %} license{%= licenses.length === 1 ? '' : 's' %}.
 */

var ConfigParser = require('wirecloud-config-parser');
var parser = new ConfigParser('src/{% if (json) { %}config.json{% } else { %}config.xml{% } %}');

module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({

        metadata: parser.getData(),{% if (bower) { %}

        bower: {
            install: {
                options: {
                    layout: function (type, component, source) {
                        return type;
                    },
                    targetDir: './build/lib/lib',
                    copy: true
                }
            }
        },{% }%}{% if (js) { %}

        eslint: {
            operator: {
                src: 'src/js/**/*.js',
            },
            grunt: {
                options: {
                    configFile: '.eslintrc-node'
                },
                src: 'Gruntfile.js',
            },
            test: {
                options: {
                    configFile: '.eslintrc-jasmine'
                },
                src: ['src/test/**/*.js', '!src/test/fixtures/']
            }
        },{% } else { %}typescript: {
            base: {
                src: ['src/ts/*.ts'],
                dest: 'src/js',
                options: {
                    module: 'commonjs', //amd or commonjs
                    target: 'es5', //or es3
                    // basePath: '',
                    sourceMap: true,
                    declaration: true
                }
            }
        },

        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files: {
                src: ['src/ts/*.ts']
            }
        },{% }%}

        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/js', src: '*', dest: 'build/src/js'}
                ]
            }
        },

        coveralls: {
            library: {
                src: 'build/coverage/lcov/lcov.info',
            }
        },

        strip_code: {
            test_code: {
                src: ['build/src/js/**/*.js']
            }
        },

        compress: {
            operator: {
                options: {
                    mode: 'zip',
                    archive: 'dist/<%= metadata.vendor %>_<%= metadata.name %>_<%= metadata.version %>.wgt'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: [
                            'DESCRIPTION.md',
                            'css/**/*',
                            'doc/**/*',
                            'images/**/*',{% if(!js) { %}
                            'ts/**/*',{% }%}{% if (json) { %}
                            "config.json",{% } else { %}
                            "config.xml", {% } %}
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'build/lib',
                        src: [
                            'lib/**/*'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'build/src',
                        src: [
                            'js/**/*'
                        ]
                    },
                    {
                        expand: true,
                        cwd: '.',
                        src: [
                            'LICENSE'
                        ]
                    }
                ]
            }
        },

        clean: {
            build: {
                src: ['build'{% if (bower) { %},'bower_components'{% }%}]
            },
            temp: {
                src: ['build/src']
            }
        },{% if(!js) { %}

        replace: {
              exports: {
                  overwrite: true,
                  src: ['src/js/*.js'],
                  replacements: [{
                      from: /exports\.([\S]+) = ([\S]+);/g,
                      to: function (matched, index, fullt, regexm) {
                          var toexpr = regexm[0];
                          var fromexpr = regexm[1];

                          var newexpr = "";

                          newexpr += "\nif (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {\n";
                          newexpr += "    module.exports = " + fromexpr + ";\n} else {\n";
                          newexpr += "    if (typeof define === 'function' && define.amd) {\n        define([], function() {\n            return " + fromexpr + ";\n        });\n}\n    else {\n";

                          newexpr += "        window." + toexpr + " = " + fromexpr + ";\n    }\n}";

                          return newexpr;
                      }
                  }]
              }
        },{% }%}

        karma: {
            options: {
                customLaunchers: {
                    ChromeNoSandbox: {
                        base: "Chrome",
                        flags: ['--no-sandbox']
                    }
                },
                files: [
                    'node_modules/mock-applicationmashup/dist/MockMP.js',
                    'src/js/*.js',
                    'tests/js/*Spec.js'
                ],
                exclude: [
                    'src/js/main.js',
                ],
                frameworks: ['jasmine'],
                reporters: ['progress', 'coverage'],
                browsers: ['Chrome', 'Firefox'],
                singleRun: true
            },
            operator: {
                options: {
                    coverageReporter: {
                        type: 'html',
                        dir: 'build/coverage'
                    },
                    preprocessors: {
                        'src/js/*.js': ['coverage'],
                    }
                }
            },
            operatorci: {
                options: {
                    junitReporter: {
                        "outputDir": 'build/test-reports'
                    },
                    reporters: ['junit', 'coverage'],
                    browsers: ['ChromeNoSandbox', 'Firefox'],
                    coverageReporter: {
                        reporters: [
                            {type: 'cobertura', dir: 'build/coverage', subdir: 'xml'},
                            {type: 'lcov', dir: 'build/coverage', subdir: 'lcov'},
                        ]
                    },
                    preprocessors: {
                        "src/js/*.js": ['coverage'],
                    }
                }
            }
        },

        wirecloud: {
            options: {
                overwrite: false
            },
            publish: {
                file: 'dist/<%= metadata.vendor %>_<%= metadata.name %>_<%= metadata.version %>.wgt'
            }
        }

    });

    grunt.loadNpmTasks('grunt-wirecloud');
    {% if (bower) { %}grunt.loadNpmTasks('grunt-bower-task');
    {% }%}{% if (js){ %}grunt.loadNpmTasks('grunt-karma'); // when test?
    grunt.loadNpmTasks('gruntify-eslint');{% } else { %}grunt.loadNpmTasks('grunt-tslint');
    grunt.loadNpmTasks('grunt-typescript');{% }%}
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-coveralls');
    grunt.loadNpmTasks('grunt-strip-code');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('test', [{% if (bower) { %}
        'bower:install',{% }%}{% if (js) { %}
        'eslint',
        'karma:operator'{% } else { %}
        'tslint'{% }%}
    ]);

    grunt.registerTask('ci', [{% if (bower) { %}
        'bower:install',{% }%}{% if (js) { %}
        'eslint',
        'karma:operatorci',{% } else { %}
        'tslint',{% }%}
        'coveralls'
    ]);

    grunt.registerTask('build', [
        'clean:temp',{% if(!js) { %}
        'replace:exports',{% }%}
        'copy:main',
        'strip_code',
        'compress:operator'
    ]);

    grunt.registerTask('default', [{% if (!js) { %}
        'typescript:base',
        'strip_code:imports',{% }%}
        'test',
        'build'
    ]);

    grunt.registerTask('publish', [
        'default',
        'wirecloud'
    ]);

};
