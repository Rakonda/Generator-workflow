'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var fs    = require('fs');


var WorkflowGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = yeoman.file.readJSON(path.join(__dirname, '../package.json'));

    this.on('end', function () {
      if (!this.options['skip-install']) {
        this.npmInstall();
        this.spawnCommand('grunt', ['prepare']);
      }
    });
  },

  askFor: function () {
    var done = this.async();

    // have Yeoman greet the user
    console.log(this.yeoman);

    // replace it with a short and sweet description of your generator
    console.log(chalk.magenta('You\'re using the fantastic Workflow generator.'));

    var prompts = [{
      type: 'input',
      name: 'project_name',
      message: 'What is the project\'s name: ',
      default: "random_name"
    }];

    this.prompt(prompts, function (props) {
      var p_n;
      if(props.project_name == "random_name") {
        p_n = "Project " + Math.random();
      }else{
        p_n = props.project_name;
      }
      var data = {};
      var d = new Date();
      data.project_name = p_n;
      data.creation_date  = d.getDate() +"-"+d.getMonth()+"-"+d.getFullYear();
      data.version = "1";
      data.base_name = "app";
      // Write project info into file.
      fs.writeFileSync('project.txt', JSON.stringify(data, null, " "), 'utf8');
      done();
    }.bind(this));
  },

  app: function () {
    this.mkdir('app');
    this.mkdir('backup');
    this.mkdir('app/css');
    this.mkdir('app/js');
    this.mkdir('app/img');

    this.copy('_package.json', 'package.json');
    this.copy('_bower.json', 'bower.json');
  },

  projectfiles: function () {
    this.copy('editorconfig', '.editorconfig');
    this.copy('main.less', 'app/css/main.less');
    this.copy('plugins.js', 'app/js/plugins.js');
    this.copy('index.html', 'app/index.html');
    this.copy('jshintrc', '.jshintrc');
    this.copy('Gruntfile.js', 'Gruntfile.js');

  }
});

module.exports = WorkflowGenerator;