/*global module:false*/
module.exports = function(grunt) {

// Load grunt tasks automatically
require('load-grunt-tasks')(grunt);
var fs    = require('fs');
var _     = require('underscore')._;
var dir     = require('node-dir');
var inquirer = require("inquirer");
var app_path = __dirname+'/app';
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
        cmd: "cd app & tree /f /a > %temp%\Listing >> files_structure.txt",
        bg: true
      }
    }
}); // end of grunt config

grunt.event.on('watch', function(action, fileproject, target) {
 grunt.log.oklns(target + ':ee ' + fileproject + ' has ' + action);
});

// Run server
grunt.registerTask('server', 'Treat yo\' self!', function() {
 grunt.task.run(['connect:livereload','watch']);
});



grunt.registerTask('prepare', 'Prepare work folder', function() {
var done = this.async();

dir.files("app", function(err,  files) {
    if (err) throw err;
    var arr = [];
    for(var i in files) {
      arr[i] = new Array();
      arr[i][0] = files[i];
      arr[i][1] = fs.statSync(files[i]).ctime.getTime();
      arr[i][2] = fs.statSync(files[i]).mtime.getTime();
      arr[i][3] = fs.statSync(files[i]).size;
      arr.push(arr[i]);
    }
    arr = _.uniq(arr, false);
    grunt.file.write('Files.txt', JSON.stringify(arr, null, 1), 'utf8');

    //console.log(arr);
});

});

// Run Build 
grunt.registerTask('build', 'Treat yo\' self!', function() {
  var done = this.async();
  var data = [];
  var project_info = [];

  // Get project infromations
  try {
    project_info = grunt.file.readJSON('project.txt',"utf8");
  } catch (e) {
    grunt.log.errorlns(e);
  }

  // Read files.txt file, and get data from it.
  try {
    data = grunt.file.readJSON('Files.txt',"utf8");
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
    }
  ];

  // Check for the deleted files.
   var deleted_files = [];
   for(var i in data)
   {
    if(grunt.file.exists(data[i][0]) === false) deleted_files.push(data[i][0]);
   }
    
    // Check for the new files.
    dir.files("app", function(err,  files) {
    if (err) throw err;
     var arr = [];
    for(var x in files) {
      arr[x] = new Array();
      arr[x][0] = files[x];
      arr[x][1] = fs.statSync(files[x]).ctime.getTime();
      arr[x][2] = fs.statSync(files[x]).mtime.getTime();
      arr[x][3] = fs.statSync(files[x]).size;
      arr.push(arr[x]);
    }
    arr = _.uniq(arr, false);
    var new_files = diffArray(arr, data);

    // Check for the modifed files. 
    var m_files = [];
    for(var t in arr){
      for(m in data){
        if(arr[t][0] == data[m][0]){
          if(arr[t][2] != data[m][2])
          {
            m_files.push(arr[t][0]);
          }
        }
      }
    }

    // Create log template
  var text =  "════════════════════════════════════════════════════\n";
      text += " Project       : " + project_info.project_name + "\n";
      text += " Creation date : " + project_info.creation_date + "\n";
      text += " Version       : " + project_info.version + "\n";
      text += " Default base  : " + project_info.base_name + "\n";
      text += "════════════════════════════════════════════════════\n\n";
      text += "Deleted files (" + _.size(deleted_files) + ") :\n\n";
      if(_.size(deleted_files) > 0) {
        for(var df in deleted_files) text += "\t-> "+ deleted_files[df] +"\n";
      }
      text += "————————————————————————————————————————————————————\n\n";
      text += "New files (" + _.size(new_files) + ") :\n\n";
      if(_.size(new_files) > 0) {
        for(var nf in new_files) text += "\t► "+ new_files[nf][0] +"\n";
      }
      text += "————————————————————————————————————————————————————\n\n";
      text += "Modifed files (" + _.size(m_files) + ") :\n\n";
      if(_.size(m_files) > 0) {
        for(var mf in m_files) text += "\t► "+ m_files[mf] +"\n";
      }
      text += "\n\n\n";

      fs.appendFile('log.txt', text, function (err) {
        if (err) throw err;
      });
    // grunt.file.write('log.txt', text, 'utf8');
  });


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

// Default task.
grunt.registerTask('default');
};