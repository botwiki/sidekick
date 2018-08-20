/*********************************************************************************

Log group activity in the #logs channel.

*********************************************************************************/

var channel_ids = require(__dirname + '/../channel_ids.js'),
    helpers = require(__dirname + '/../helpers.js');

module.exports = function(controller) {
  controller.on('reaction_added', function(bot, message){

    var message_user = message.user,
        message_reaction = message.reaction,
        message_channel = message.item.channel;
    
    console.log(message_channel);
    
    if (message_channel && message_channel.charAt(0) !== 'G' && message_channel.charAt(0) !== 'D'){
      console.log(message);
      bot.api.conversations.members({
        channel: channel_ids.logs
      }, function(err, data){
        console.log('################', data);
        if (data.members.indexOf(message_user) === -1){
          helpers.log_event(bot, `<@${message_user}> reacted with :${message_reaction}: in <#${message_channel}>.`);  
        }
        else if (message_channel && message_channel !== channel_ids.testing){
          bot.api.users.info({
            user: message_user
          }, function(err, data){
            console.log(data.user.name);
            // helpers.log_event(bot, `*${data.user.name}* reacted with :${message_reaction}: in <#${message_channel}>.`);  
            helpers.log_event(bot, `*someone in this channel* reacted with :${message_reaction}: in <#${message_channel}>.`);              
          });
        }
      });
    }        
  });
}


