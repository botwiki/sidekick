/*********************************************************************************
Send an ephemeral message to a group member.

/sidekick dm @username MESSAGE

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js'),
    wordfilter = require('wordfilter');

function explain_send_dm(bot, message_original){
  var attachments = [], attachment = {
    title: 'Sending DMs',
    color: '#333',
    fields: [],
    mrkdwn_in: ['fields']
  };

  attachment.fields.push(
    {
      value: '`/sidekick dm @user MESSAGE`'
    }
  );

  attachments.push(attachment);

  bot.api.chat.postEphemeral({
    channel: message_original.channel,
    user: message_original.user,
    attachments: JSON.stringify(attachments)
  });
}

module.exports = function(controller) {  
  controller.on('slash_command', function(bot, message, cb) {
    var bot = bot,
        message_original = message,
        message_text_arr = message.text.split(' '),
        command = message_text_arr[0];

    if (command === 'dm'){
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
          /* TODO: This code is a bit messy, clean up later! */
          var patt_user_id = new RegExp(/(?:<@).*?(?:>)/gi);

          var message_arr = message_original.text.split(' '),
              dm_detect_user, dm_text, dm_text;
          
          console.log({message_arr});
          
          if (message_arr && message_arr.length > 2){
            dm_detect_user = message_arr[1];

            // var dm_user = patt_user_id.exec(dm_detect_user)[0].replace(/[<\|#>]/g, '').replace('@', '');          
            var dm_user = dm_detect_user.split('|')[0].replace(/[<\|#>]/g, '').replace('@', ''),
                dm_text = message_arr.slice(2).join(" ");
            console.log({dm_user}, {dm_text});

            if (dm_user && dm_text){

              
             bot.api.im.open({
                user: dm_user
              }, function(message, data){
                bot.api.chat.postMessage({
                  channel: data.channel.id,
                  text: dm_text
                }, function(message){
                  // NOOP
                });
              });                 
             

              if (message_original.user !== dm_user){
                var message_for_mods = `<@${message.user}> sent a DM to <@${dm_user}>:\n\n>>>${dm_text}`;
                helpers.notify_mods(bot, message.user_id, message_for_mods, function(err, data){});
              }                
            }
            else{
              console.log(1);
              explain_send_dm(bot, message_original);            
            }
          }
          else{
            console.log(2);
            explain_send_dm(bot, message_original);          
          }
        }      
      });
    }
  });

  controller.middleware.receive.use(function(bot, message, next) {

    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      console.log('message_actions\n', message.actions);

      if (message.actions[0].name === 'actions') {
        if (message.actions[0].value === 'moderator_commands') {
          helpers.is_admin(bot, message, function(err){
            if (!err){
              explain_send_dm(bot, message_original);
            }
          });
        }
      }
    }
    next();
  });
}
