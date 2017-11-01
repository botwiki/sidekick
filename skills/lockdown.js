/*********************************************************************************
Lock down the Slack group.

/sidekick lockdown [off]

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js'),
    channel_ids = require(__dirname + '/../channel_ids.js');

var lockdown_status = false;

module.exports = function(controller) {
  
  controller.storage.teams.all(function(err, all_team_data) {
    console.log('lockdown status: ', all_team_data[0].lockdown);
    lockdown_status = all_team_data[0].lockdown;
  });

  controller.on('mention,direct_mention,ambient', function(bot, message) {
    console.log({lockdown_status});
    if (lockdown_status === true){
      bot.api.chat.delete({
        token: process.env.superToken,
        channel: message.channel,
        ts: message.ts
      }, function(err, message){
        if (err){
          console.log('error:\n', err);
        }
      });
    }
  });

  controller.on('slash_command', function(bot, message, cb) {
    var bot = bot,
        message_original = message,
        {command, args} = helpers.parse_slash_command(message);
    
    if (command === 'lockdown'){
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, function(err){
        if (err){
          bot.api.chat.postEphemeral({
            channel: message_original.channel_id,
            user: message_original.user_id,
            text: err.error_message
          });
        }
        else{
          if (args[0] === 'off'){
            lockdown_status = false;
            bot.api.chat.postMessage({
              channel: channel_ids.general,
              text: `<@${message.user}> cancelled lockdown.`
            });
            
            bot.api.chat.postEphemeral({
              channel:message.channel,
              user: message.user,
              text: 'Lockdown cancelled.',
             });
          }
          else{
            lockdown_status = true;

            bot.api.chat.postMessage({
              channel: channel_ids.general,
              text: `<@${message.user}> initiated lockdown, all posts will be deleted until lockdown is disabled.`
            });
            
            bot.api.chat.postEphemeral({
              channel:message.channel,
              user: message.user,
              text: 'Lockdown initiated. To disable, please use `/sidekick lockdown off`.',
             });
          }

          
          controller.storage.teams.get(message.team_id, function(err, data) {
            data.lockdown = lockdown_status;
            controller.storage.teams.save(data, function(err, data) {
              //NOOP
            });
          });
        }      
      });
    }
  });
}


