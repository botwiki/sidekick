var helpers = require(__dirname + '/../helpers.js');

module.exports = function(controller) {
  controller.middleware.receive.use(function(bot, message, next) {
    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      console.log('message_actions\n', message.actions);

      if (message.actions[0].name === 'actions') {
        if (message.actions[0].value === 'learn_more') {
          helpers.get_group_info(bot, message, function(err, data){
            bot.api.chat.postEphemeral({
              channel:message_original.channel,
              user: message_original.user,
              attachments: data
            });          
          });          
        }
        else if (message.actions[0].value === 'learn_more_bots') {
          helpers.get_bot_info(bot, message, function(err, data){
            bot.api.chat.postEphemeral({
              channel:message_original.channel,
              user: message_original.user,
              attachments: data
            });          
          });          
        }        
        else if (message.actions[0].value === 'contact_moderators') {
          bot.api.dialog.open({
            trigger_id: message.trigger_id,
            dialog: JSON.stringify({
              'callback_id': 'send_moderators_message',
              'title': 'Contact moderators',
              'submit_label': 'Send',
              'elements': [
                {
                    'type': 'textarea',
                    'label': 'Your message',
                    'name': 'message'
                }
              ]
            })
          }, function(err, data){
            console.log({err, data});
            if (err){
              console.log(data.response_metadata)
            }
          });
        }
      }
    }
    next();
  });
}
