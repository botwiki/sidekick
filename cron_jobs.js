var fs = require('fs'),
    fsPath = require('fs-path'),
    helpers = require(__dirname + '/helpers.js'),
    moment = require('moment'),  
    channel_ids = require(__dirname + '/channel_ids.js');


module.exports = function(controller){
    return [
    {
      description: 'update last active statuses based on login information',
      interval: '*/10 * * * *',
      job: function(){
        
        controller.storage.teams.all(function(err, all_team_data) {
          var bot = controller.spawn({token: all_team_data[0].token});
          bot.api.team.accessLogs({ token: process.env.superToken }, function(err, data){
            // console.log({data});
            data.logins.forEach(function(member){
              if (member.date_last){
                var active_time =   moment.unix(member.date_last).format();  
                helpers.update_last_active_time(controller, bot, member.user_id, active_time);
              }
            });            
          });
        });        
      }
    },
    {
      description: 'post group info into #logs once every hour',
      interval: '0 * * * *',
      job: function(){
        
        controller.storage.teams.all(function(err, all_team_data) {
          var bot = controller.spawn({token: all_team_data[0].token});
          helpers.get_group_info(bot, null, function(err, data){
            helpers.log_event(bot, '', data);
          });
        });        
      }
    },
    {
      description: 'dump DB every hour',
      interval: '0 * * * *',
      job: function(){
        var d = new Date(),
            db_dump_filename = `db_dump_${helpers.padNumber(d.getFullYear(), 2)}-` +
                               `${helpers.padNumber(d.getMonth(), 2)}-`           +
                               `${helpers.padNumber(d.getDate(), 2)}_`            +
                               `${helpers.padNumber(d.getHours(), 2)}-`           +
                               `${helpers.padNumber(d.getMinutes(), 2)}.db`;

        controller.storage.teams.all(function(err, all_team_data) {
          fsPath.writeFile(`.data/db_dump/${db_dump_filename}`, JSON.stringify(all_team_data), function(err){
            console.log(`dumping DB...`);          
            if(err) {
                return console.log(err);
            }else{
              console.log(`DB saved to ${db_dump_filename}`);

              fs.readdir('.data/db_dump', function(err, files) {
                // console.log(files.length, {files})
                var max_files_count = 80;
                if (files.length > max_files_count){
                  var old_files = files.slice(0, files.length - max_files_count)
                  // console.log({old_files})
                  old_files.forEach(function(file){
                    fs.unlink(`.data/db_dump/${file}`);
                  });
                }                
              });   
            }
          });
        });        
      } 
    }
  ]; 
} 
