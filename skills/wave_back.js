/*********************************************************************************

Wave back to folks saying hello. (#general channel only)

*********************************************************************************/

var channel_ids = require(__dirname + '/../channel_ids.js');

module.exports = function(controller) {  
  controller.hears([
    'hi everyone',
    'hello everyone',
    'good morning',
    'happy friday',
    'happy monday'
  ], 'ambient', function(bot, message) {
   
    if (
      message.channel === channel_ids.general ||
      message.channel === channel_ids.testing ||
      message.channel === channel_ids.testing_private
    ){
      bot.api.reactions.add({
          timestamp: message.ts,
          channel: message.channel,
          name: 'wave',
      }, function(err, res) {
        if (err){
          console.log('error\n', err);
        }
      });
    } 
  });  
}

