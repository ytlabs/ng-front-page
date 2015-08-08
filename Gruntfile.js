module.exports = function (grunt) {
    grunt.initConfig({
        uglify: {
            project: {
                options: {
                    mangle: true
                },
                src: ['ng-front-page.js'],
                dest: 'ng-front-page.min.js'
            }
        },
        less: {
            project: {
                options: {
                    //compress: true
                },
                src: ['ng-front-page.less'],
                dest: 'ng-front-page.css'
            }
        },
        watch: {
            project: {
                options: {
                    atBegin: true
                },
                files: ['ng-front-page.less', 'ng-front-page.js'],
                tasks: ['uglify', 'less']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['uglify', 'less']);
};