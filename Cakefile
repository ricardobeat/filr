flour = require 'flour'

task 'build', ->
    compile 'src/*', 'lib/*'

task 'watch', ->
    watch ['src/', 'bin/'], -> invoke 'build'