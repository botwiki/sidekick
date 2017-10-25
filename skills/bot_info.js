/*********************************************************************************
List bots added to the group.

/sidekick bots

*********************************************************************************/

var request = require('request'),
    wordfilter = require('wordfilter');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js');

module.exports = function(controller) {
  controller.hears([
    'list bots',
    'list all bots',
    'what bots are here'
  ], 'direct_message,direct_mention', function(bot, message) {
      var message_original = message;
      if (!wordfilter.blacklisted(message.match[1])) {
        helpers.get_bot_info(bot, message, function(err, data){
          bot.reply(message_original, {
            attachments: data
          });
        });        
      } else {
          bot.reply(message, '_sigh_');
      }
  });  
  
  controller.on('slash_command', function(bot, message) {
    var message_original = message;
    var message_text_arr = message.text.split(' ');
    var command = message_text_arr[0],
        channel = helpers.parse_channel_ids(message_text_arr[1])[0];

    if (command === 'bots'){
      // bot.replyAcknowledge();

      helpers.get_bot_info(bot, message, function(err, data){
        bot.api.chat.postEphemeral({
          channel:message_original.channel,
          user: message_original.user,
          attachments: data
        });
      });
    }
  });
}


