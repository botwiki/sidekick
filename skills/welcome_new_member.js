/*********************************************************************************
Weclome new members.

*********************************************************************************/

var wordfilter = require('wordfilter'),
    helpers = require(__dirname + '/../helpers.js'),
    channel_ids = require(__dirname + '/../channel_ids.js');

function send_welcome_message(controller, bot, message){
  console.log({
    'message.user_id:': message.user_id,
    'message.user.id:': message.user.id,
    'message.user:': message.user 
  });
  var user_id = message.user.id || message.user_id || message.user;
  
  // console.log('sending out welcome message...\n', {message});
  // TODO: The ephemeral welcome message doesn't get triggered on team_join, only works with the testing slash command.
  
  setTimeout(function(){
    bot.api.chat.postEphemeral({
      channel: channel_ids.general,
      user: user_id,
      text: `Hi <@${user_id}>, come say hello! :wave:`
    });  
  }, 6000);

  if (controller.config.welcome_message){
    bot.api.im.open({
      user: user_id
    }, function(message, data){
      bot.api.chat.postMessage({
        channel: data.channel.id,
        text: controller.config.welcome_message
      }, function(message){
        // NOOP
      });
    });      
  }
}

module.exports = function(controller) {
  controller.on('slash_command', function(bot, message) {
    var message_original = message;
    var {command, args} = helpers.parse_slash_command(message);

    if (command === 'test'){
      bot.replyAcknowledge();

      if (args[0] === 'welcome'){
        send_welcome_message(controller, bot, message);
      }
    }
  });  
  
  controller.on('team_join', function(bot, message) {
    send_welcome_message(controller, bot, message);
  });
}


