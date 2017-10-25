/*********************************************************************************
Send a message to all moderators.

/sidekick mods Hello, this is for the group moderators.

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js'),
    wordfilter = require('wordfilter');

module.exports = function(controller) {
  controller.hears([
    'forward to mods',
    'forward to moderators',
    'for mods',
    'for moderators',
    'forward to admins',
    'for admins'
  ], 'direct_message,direct_mention', function(bot, message) {
      var message_original = message;
      if (!wordfilter.blacklisted(message.match[1])) {
        helpers.notify_mods(bot, message.event.user, message.text, function(err, data){
          if (err){
            bot.api.chat.postMessage({
              channel:message_original.channel,
              user: message_original.user,
              text: `There was an error: ${err.error_message}.`
            });
          }
          else{
            bot.api.chat.postMessage({
              channel:message_original.channel,
              user: message_original.user,
              text: 'Thank you! Someone from the Botmakers team will follow up with you soon.'
            });
          }
        });      
      } else {
          bot.reply(message, '_sigh_');
      }
  });    

  controller.on('dialog_submission', function(bot, event) {
    bot.replyAcknowledge();
    var event = event;
    var submission = event.submission;
    console.log({event}, {submission});
    
    if (event.callback_id === 'send_moderators_message'){
      helpers.notify_mods(bot, event.user, submission.message, function(err, data){
        if (err){
          bot.api.chat.postEphemeral({
            channel:event.channel,
            user: event.user,
            text: `There was an error: ${err.error_message}.`
          });
        }
        else{
          bot.api.chat.postEphemeral({
            channel:event.channel,
            user: event.user,
            text: 'Thank you! Someone from the Botmakers team will follow up with you soon.'
          });
        }
      });      
    }   
  });  
  
  controller.on('slash_command', function(bot, message, cb) {
    var bot = bot,
        message_original = message,
        message_text_arr = message.text.split(' '),
        command = message_text_arr[0];

    if (command === 'mods'){
      var message_for_mods = message.text.replace('mods', '');
      helpers.notify_mods(bot, message.user_id, message_for_mods, function(err, data){
        if (err){
          bot.api.chat.postEphemeral({
            channel: message_original.channel,
            user: message_original.user,
            text: `There was an error: ${err.error_message}.`
          });
        }
        else{
          bot.api.chat.postEphemeral({
            channel:message_original.channel,
            user: message_original.user,
            text: 'Thank you! Someone from the Botmakers team will follow up with you soon.'
          });
        }
      });
    }
  });
}


