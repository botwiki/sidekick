/******************************************************************************
 ________  ___  ________  _______   ___  __    ___  ________  ___  __       
|\   ____\|\  \|\   ___ \|\  ___ \ |\  \|\  \ |\  \|\   ____\|\  \|\  \     
\ \  \___|\ \  \ \  \_|\ \ \   __/|\ \  \/  /|\ \  \ \  \___|\ \  \/  /|_   
 \ \_____  \ \  \ \  \ \\ \ \  \_|/_\ \   ___  \ \  \ \  \    \ \   ___  \  
  \|____|\  \ \  \ \  \_\\ \ \  \_|\ \ \  \\ \  \ \  \ \  \____\ \  \\ \  \ 
    ____\_\  \ \__\ \_______\ \_______\ \__\\ \__\ \__\ \_______\ \__\\ \__\
   |\_________\|__|\|_______|\|_______|\|__| \|__|\|__|\|_______|\|__| \|__|
   \|_________|                                                             
                                                                            
******************************************************************************/

var env = require('node-env-file');
env(__dirname + '/.env');

var fs = require('fs'),
    path = require('path');

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  console.log('Error: Specify clientId clientSecret and PORT in environment');
  process.exit(1);
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    // debug: true,
    scopes: require(__dirname + '/scopes.js'),
    studio_token: process.env.studio_token,
    studio_command_uri: process.env.studio_command_uri,
    welcome_message: null
};

fs.readFile(path.join(__dirname, 'messages/welcome.txt'), 'utf8', function (err, data) {
  if (err){
    console.log(err);
  }
  else{
    bot_options.welcome_message = data;
  }
});


var twitter_options = {
  tracked_keywords: [],
  ignored_keywords: []
};

if (process.env.MONGO_URI) {
    var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.MONGO_URI});
    bot_options.storage = mongoStorage;
} else {
    bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}

var controller = Botkit.slackbot(bot_options);
controller.startTicking();

var cron = require('node-cron'),
    cron_jobs = require(__dirname + '/cron_jobs.js');

cron_jobs(controller).forEach(function(job){
  if (job.interval && job.job){
    console.log(`starting job: ${job.description}`);
    cron.schedule(job.interval, job.job);
  }
})

var webserver = require(__dirname + '/components/express_webserver.js')(controller);
require(__dirname + '/components/user_registration.js')(controller);
require(__dirname + '/components/onboarding.js')(controller);
require(__dirname + '/components/plugin_glitch.js')(controller);

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller);
});
