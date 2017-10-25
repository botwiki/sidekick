var channel_ids = require(__dirname + '/../channel_ids.js'),
    helpers = require(__dirname + '/../helpers.js');

/*********************************************************************************

Log group activity in the #logs channel.

*********************************************************************************/

module.exports = function(controller) {
  controller.on('reaction_added', function(bot, message){
    
    var message_user = message.user,
        message_reaction = message.reaction,
        message_channel = message.item.channel;
    
    if (message_channel.charAt(0) !== 'G'){
      helpers.log_event(bot, `<@${message_user}> reacted with :${message_reaction}: in <#${message_channel}>.`);      
      // log_event(bot, `<@${message_user}> reacted with :${message_reaction}: in <#${message_channel}>.`)
    }    
    
  });
}


