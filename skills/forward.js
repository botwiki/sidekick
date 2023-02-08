/*********************************************************************************

This is a handler for forwarding tweets found in the #feed channel.

*********************************************************************************/

var helpers = require(__dirname + '/../helpers.js'),
    // twitter = require(__dirname + '/../twitter.js'),
    channel_ids = require(__dirname + '/../channel_ids.js');

module.exports = function(controller) {
  controller.on('dialog_submission', function(bot, event) {
    bot.replyAcknowledge();
    var event = event,
        submission = event.submission;
    
    // console.log({event}, {submission});
    
    if (event.callback_id === 'forward_message'){
      console.log('forward_message', submission);
      if (submission.forward_channel_select in channel_ids){
        bot.api.chat.postMessage({
          // channel: 'C0AQZLT32',
          channel: channel_ids[submission.forward_channel_select],
          text: `<@${event.user}> found this in <#${channel_ids.bot_feed}>: ${submission.tweet_url}`,
          unfurl_links: true,
          unfurl_links: true
        });        
      }
    }   
  });  
}
