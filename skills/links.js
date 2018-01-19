/*********************************************************************************

Links to projects should be posted to the #projects channel, not #general.

*********************************************************************************/

var wordfilter = require('wordfilter'),
    channel_ids = require(__dirname + '/../channel_ids.js');

module.exports = function(controller) {
  /* Remind folks using "guys" about gender-neutral alternatives. */
  controller.on('ambient', function(bot, message){
  var message_text = message.text.toLowerCase().replace(/\s+/g,' ').trim();

  // console.log('ambient\n', message.channel, message_text);

  console.log({
    'message.channel': message.channel,
    'channel_ids.general': channel_ids.general,
    'channel_ids.testing': channel_ids.testing,
    'channel_ids.testing_private': channel_ids.testing_private  
  });

  if (
      (
        message.channel === channel_ids.general ||
        message.channel === channel_ids.testing ||
        message.channel === channel_ids.testing_private
      )
    && (
      (
        message_text.indexOf('http://') > -1 ||
        message_text.indexOf('https://') > -1)
      ) 
    ){


      bot.api.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        text: 'Posting a link? Consider moving your message to a more appropriate channel:\n\n' +
              ` - <#${channel_ids.projects}>\n` +
              ` - <#${channel_ids.help}>\n` +
              ` - <#${channel_ids.tools_resources}>\n` +
              ` - <#${channel_ids.news}>\n`
      });        

    }
    else{
      // console.log(message.channel, message_text.indexOf('http://'));
    }
  });
}


