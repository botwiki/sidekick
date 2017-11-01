var helpers = require(__dirname + '/../helpers.js');

module.exports = function(controller) {
  controller.middleware.receive.use(function(bot, message, next) {
    var message_original = message;
    if (message.type == 'interactive_message_callback') {

      if (message.actions[0].name === 'actions') {
        if (message.actions[0].value === 'delete_account') {
          var user_id = message.user;
          helpers.deactivate(bot, message_original, user_id, function(){
            var message_for_mods = `<@${user_id}> deleted their account.`;
            helpers.notify_mods(bot, null, message_for_mods, function(err, data){});  
          });
        }
      }
    }
    next();
  });
}
