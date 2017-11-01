/*********************************************************************************

Disable a Slack group member's account.

/sidekick remove @user

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    qs = require('qs'),
    helpers = require(__dirname + '/../helpers.js');

function explainRemove(bot, message_original){
  var attachments = [], attachment = {
    title: 'Removing users from Slack group',
    color: '#333',
    fields: [],
    mrkdwn_in: ['fields']
  };

  attachment.fields.push(
    {
      value: '`/sidekick remove @user`'
    }
  );

  attachments.push(attachment);

  bot.api.chat.postEphemeral({
    channel: message_original.channel,
    user: message_original.user,
    text: 'Here\'s how you can use the `/sidekick remove` command.',
    attachments: JSON.stringify(attachments)
  });
}

module.exports = function(controller) {  
  controller.on('slash_command', function(bot, message, cb) {
    var bot = bot,
        message_original = message,
        message_text_arr = message.text.split(' '),
        command = message_text_arr[0];

    if (command === 'remove'){
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
              remove_detect_user;
          
          console.log({message_arr});
          
          if (message_arr && message_arr.length > 0){

              remove_detect_user = message_arr[1];

            
            if (!remove_detect_user){
              explainRemove(bot, message_original);
            }
            else{
              // var remove_user_id = patt_user_id.exec(remove_detect_user)[0].replace(/[<\|#>]/g, '').replace('@', '');          
              var remove_user_id = remove_detect_user.split('|')[0].replace(/[<\|#>]/g, '').replace('@', '');

              if (remove_user_id){
                console.log('removing user...', {remove_user_id});
                helpers.deactivate(bot, message_original, remove_user_id, function(){
                  var message_for_mods = `<@${message.user}> removed <@${remove_user_id}> from this group.`;
                  helpers.notify_mods(bot, null, message_for_mods, function(err, data){});                  
                });
              }
              else{
                explainRemove(bot, message_original);            
              }
            }
          }
          else{
            explainRemove(bot, message_original);          
          }
        }      
      });
    }
  });
}


