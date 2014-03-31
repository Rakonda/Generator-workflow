/*global module:false*/
module.exports = function(grunt) {

// Load grunt tasks automatically
require('load-grunt-tasks')(grunt);

// require it at the top and pass in the grunt instance
require('time-grunt')(grunt);

var fs    = require('fs');
var _     = require('underscore')._;
var inquirer = require("inquirer");
var path = require('path');

// Define the configuration for all the tasks
grunt.initConfig({
 project: {
   app: 'app',
   build: 'build',
   backup: 'backup',
   zipnamz: 'thiszip'
 },
 jshint: {
   files: 'Gruntfile.js',
   options: {
     curly: true,
     eqeqeq: true,
     immed: true,
     latedef: true,
     newcap: true,
     noarg: true,
     sub: true,
     undef: true,
     boss: true,
     eqnull: true,
     browser: true,
     globals: {
       require: true,
       define: true,
       requirejs: true,
       describe: true,
       expect: true,
       it: true
     }
   }
 },
 connect: {
   options: {
     port: 9000,
     livereload: true,
     hostname: '127.0.0.1'
   },
   livereload: {
     options: {
       open: true, // Open the served page in your default browser. 
       base: '<%= project.app %>' // App base dirictory to run files from.
     }
   },
   https: {
     options: {
       open: true,
       base: '<%= project.app %>',
       protocol: 'https'
     }
   }
 },
 watch: {
   options: {
     livereload: true,
   },
   script: {
     files: ['<%= project.app %>/js/{,*/}*.js','Gruntfile.js'],
     tasks: ['jshint'],
   },
   style: {
     files: '<%= project.app %>/css/{,*/}*.{css,less}',
   },
   image: {
     files: '<%= project.app %>/img/{,*/}*.{gif,jpeg,jpg,png,svg,webp}',
   },
   html: {
     files: 'app/{,*/}*.html',
   }
 },
 mocha: {
   options: {
        reporter: 'XUnit',
        require: ['should'],
        output: 'test-results.xml',
        bail: false
      },
   all: ['<%= project.app %>/index.html']
 },
 zip: {
   without_tree: {
     // Files to zip together
     src: ['app/**','log.txt'],

     // Destination of zip file
     dest: 'backup/project.zip'
   },
   with_tree: {
     // Files to zip together
     src: ['app/**','log.txt', 'files_structure.txt'],

     // Destination of zip file
     dest: 'backup/project.zip'
   }
 },
 bgShell: {
      _defaults: {
        bg: true
      },
      tree: {
        cmd: 'tree ' + __dirname + '\\<%= project.app %> /f /a > files_structure.txt',
        bg: true
      }
},
copy: {
  main: {
    files: [
      // includes files within path and its sub-directories
      {expand: true, src: ['app/**'], dest: 'dest/'},
    ]
  }
},
clean: ["dest"]
}); // end of grunt config

grunt.event.on('watch', function(action, fileproject, target) {
 grunt.log.oklns(target + ':ee ' + fileproject + ' has ' + action);
});

// Run server
grunt.registerTask('server', 'Treat yo\' self!', function() {
 grunt.task.run(['connect:livereload','watch']);
});

grunt.registerTask('prepare', 'Make a tree informations of files in directory', function() {

var done = this.async();
grunt.file.write('Files.txt', JSON.stringify(readdirtree('app'), null, 0), 'utf8');
grunt.log.write("Files.txt updated with success.");
done();

});

// Run Build 
grunt.registerTask('build', 'Treat yo\' self!', function() {
  var done = this.async();
  var data = [];
  var project_info = [];

  try {
    //Get project infromations
    project_info = grunt.file.readJSON('project.txt',"utf8");
    // Read files.txt file, and get data from it.
    data = grunt.file.readJSON('Files.txt',"utf8");
    // Get list of files exist in project.app
    var get_files = readdirtree('app');
    console.log(get_files);
    //process.exit(0);
  } catch (e) {
    grunt.log.errorlns(e);
  }

// Setup questions.
  var questions = [
    {
      type: 'confirm',
      name: 'overwrite',
      message: 'Rescan for the files?',
      default: false
    },
    {
      type: 'input',
      name: 'version',
      message: 'Would you like to update the Current version? ',
      default: project_info.version
    },
    {
      type: 'confirm',
      name: 'tree',
      message: 'Generate files strecture? ',
      default: true
    },
    {
      type: 'confirm',
      name: 'log',
      message: 'Create new log file? ',
      default: true
    }
  ];

  // Check for the deleted files.
   var deleted_files = [];
   for(var i in data)
   {
    if(grunt.file.exists(data[i][0]) === false) deleted_files.push(data[i][0]);
   }
    
    // Check for the new files.
    var new_files = diffArray(get_files, data);

    // Check for the modifed files. 
    var m_files = [];
    for(var t in get_files){
      for(m in data){
        if(get_files[t][0] == data[m][0]){
          if(get_files[t][2] != data[m][2])
          {
            m_files.push(get_files[t][0]);
          }
        }
      }
    }

    inquirer.prompt( questions , function( answers ) {
    if (answers.overwrite) {
        try 
        {
          grunt.task.run("prepare");
          grunt.log.oklns("Files.txt have been overwritten.");
        } catch (e) {
          grunt.log.errorlns(e);
        }
      }
    
      var d = new Date();
      d = d.getDate() +"-"+d.getMonth()+"-"+d.getFullYear();
      project_info.creation_date = d;

      if(answers.version == project_info.version) {
        var outzip = project_info.project_name + " v" + project_info.version + " " +d;
      }else 
      {
        var outzip = project_info.project_name + " v" + answers.version + " " +d;
        project_info.version = answers.version;
        try 
        {
          grunt.file.write('project.txt', JSON.stringify(project_info, null, " "), 'utf8');
          grunt.log.oklns("project.txt updated to new version "+ project_info.version +".");
        } catch (e) {
          grunt.log.errorlns(e);
        }
      }

      if(answers.tree)
      {
        grunt.task.run('bgShell:tree');
        grunt.config.set('zip.with_tree.dest', 'backup/' + outzip + '.zip');
        grunt.task.run("zip:with_tree");

      }else {
        grunt.config.set('zip.without_tree.dest', 'backup/' + outzip + '.zip');
        grunt.task.run("zip:without_tree");
      }

    // Create log template
    var text =  "***************************************************\n";
        text += " Project       : " + project_info.project_name + "\n";
        text += " Creation date : " + project_info.creation_date + "\n";
        text += " Version       : " + answers.version + "\n";
        text += " Default base  : " + project_info.base_name + "\n";
        text += "════════════════════════════════════════════════════\n\n";
        text += "Deleted files (" + _.size(deleted_files) + ") :\n\n";
        if(_.size(deleted_files) > 0) {
          for(var df in deleted_files) text += "\t-> "+ deleted_files[df] +"\n";
        }
        text += "-----------------------------------------------------\n\n";
        text += "New files (" + _.size(new_files) + ") :\n\n";
        if(_.size(new_files) > 0) {
          for(var nf in new_files) text += "\t-> "+ new_files[nf][0] +"\n";
        }
        text += "-----------------------------------------------------\n\n";
        text += "Modifed files (" + _.size(m_files) + ") :\n\n";
        if(_.size(m_files) > 0) {
          for(var mf in m_files) text += "\t-> "+ m_files[mf] +"\n";
        }
        text += "\n";

        if(answers.log)
        {
          grunt.file.write('log.txt', text, 'utf8');
        }else
        {
          fs.appendFile('log.txt', text, function (err) {
            if (err) throw err;
          });
        }
        
      done();
    });


});

  // Get diffrance between two arrays
  function diffArray(a, b) {
    var seen = [], diff = [];
    for ( var i = 0; i < b.length; i++)
        seen[b[i][0]] = true;
    for ( var i = 0; i < a.length; i++)
        if (!seen[a[i][0]])
            diff.push(a[i]);
    return diff;
  }

  function readdirtree (dirname, filter, arr) {
    var uniq_arr = [];
    var arr = walk_dir("app");
    for(var i in arr) {
      uniq_arr[i] = new Array();
      uniq_arr[i][0] = arr[i];
      uniq_arr[i][1] = fs.statSync(arr[i]).ctime.getTime();
      uniq_arr[i][2] = fs.statSync(arr[i]).mtime.getTime();
      uniq_arr[i][3] = fs.statSync(arr[i]).size;
      uniq_arr.push(uniq_arr[i]);
    }
    return uniq_arr;
  }

  function walk_dir (dirname, filter, arr) {
    arr = arr || []
    filter = filter || function () { return true }

    fs.readdirSync(dirname)
    .filter(filter)
    .map(function (file) { return path.join(dirname, file) })
    .forEach(function (file) {
      if (fs.statSync(file).isDirectory()) {
          walk_dir(file, filter, arr)
      }else {
         arr.push(file)
      }
    })
    return arr = _.uniq(arr, false);
  }

// Default task.
grunt.registerTask('default');
};