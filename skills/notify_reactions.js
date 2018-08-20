/*********************************************************************************

Notify members when they receive reactions. 

*********************************************************************************/

var channel_ids = require(__dirname + '/../channel_ids.js');  

module.exports = function(controller) {
  controller.on('reaction_added', function(bot, message){
    var reaction_message = message,
        reaction_user = message.user,
        reaction_name = message.reaction,
        reaction_channel = message.item.channel;

    if (reaction_channel.charAt(0) === 'C'){
        var message_ts = message.item.ts,
        message_url = `https://${process.env.group_name}.slack.com/archives/${reaction_channel}/p${message_ts.replace('.', '')}`;

      bot.api.channels.info({
        channel: reaction_channel,
      }, function(err, message){
          /* Notify the person receiving a reaction if it's still present after 10 seconds. */

          function notify_reaction_receiver(msg){
            console.log('checking reactions...');
            bot.api.reactions.get({
                timestamp: msg.item.ts,
                channel: msg.item.channel,
                name: msg.reaction,
            }, function(err, res) {
              if (err){
                console.log('error\n', err);
              }

              console.log('more info about the reaction...', res.message);

              if (res.message.user){
                var original_message_user = res.message.user;
              }

              var original_reaction = message.reaction;

              if (res.message.reactions){
                var reactions_name = res.message.reactions.map(function(reaction){
                  return reaction.name;
                })

                // var notify_reaction = false;
                var notify_reaction = true;

                // for (var i = 0, j = reactions_name.length; i < j; i++){
                //   if (encouraging_reactions.indexOf(reactions_name[i]) > -1){
                //     console.log('notifying about reaction in 10...9...8...');
                //     notify_reaction = true;
                //   }
                // }

                if (notify_reaction){

                  controller.storage.users.get(original_message_user, function(err, data) {
                    console.log(`loading user data for ${original_message_user}...`, {err}, {data});
                    if (
                      (data && data.reaction_notifications && data.reaction_notifications == 'true')
                    ){
                      console.log('notifying about reaction...');

                      bot.api.im.open({
                        user: original_message_user
                      }, function(message, data){

                        var attachments = [
                          {
                            'fallback': 'Unable to render buttons.',
                            'callback_id': 'sidekick_actions',
                            'color': '#3AA3E3',
                            'attachment_type': 'default',
                            'actions': [
                             
                            ]
                          }
                        ];

                        attachments[0].actions.push({
                          'name': 'actions',
                          'text': 'Don\'t show these',
                          'type': 'button',
                          'value': 'disable_reaction_notifications'
                        });

                        bot.api.chat.postMessage({
                          channel: data.channel.id,
                          text: `<@${reaction_user}> left a :${reaction_name}: reaction on your post in <#${reaction_channel}>:\n\n${message_url}`,
                          attachments: attachments
                        }, function(message){
                          // NOOP
                        });
                      });
                    }
                    else{
                      console.log('user disabled reaction notifications...');                      
                    }
                  });
                }
              }
              else{
                console.log('no reactions found');
              }
            }
          );
        }

        setTimeout(function(){
          console.log('checking if reaction still exists...');
          notify_reaction_receiver(reaction_message);
        }, 5000);
      });        
    }
  });

  controller.middleware.receive.use(function(bot, message, next) {
    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      console.log('message_actions\n', message.actions);

      if (message.actions[0].name === 'actions') {
        if (message.actions[0].value === 'disable_reaction_notifications') {

          controller.storage.users.get(message_original.user, function(err, data) {
            console.log(`loading user data for ${message_original.user}...`, {err}, {data});

            if (err || !data){
              var data = {
                id: message_original.user
              };
            }

            data.reaction_notifications = 'false';

            controller.storage.users.save(data, function(err, data) {
                console.log(`saved user ${message_original.user}`, {err}, {data});
                    
                bot.api.im.open({
                  user: message_original.user
                }, function(message, data){

                  var attachments = [
                    {
                      'fallback': 'Unable to render buttons.',
                      'callback_id': 'sidekick_actions',
                      'color': '#3AA3E3',
                      'attachment_type': 'default',
                      'actions': [
                       
                      ]
                    }
                  ];

                  attachments[0].actions.push({
                    'name': 'actions',
                    'text': 'Show reaction notifications',
                    'type': 'button',
                    'value': 'enable_reaction_notifications'
                  });

                  bot.api.chat.postMessage({
                    channel: data.channel.id,
                    text: `Let me know if you change your mind!`,
                    attachments: attachments
                  }, function(message){
                    // NOOP
                  });
                });
            });
          });        
        }
        else if (message.actions[0].value === 'enable_reaction_notifications') {
          controller.storage.users.get(message_original.user, function(err, data) {
            console.log(`loading user data for ${message_original.user}...`, {err}, {data});

            if (err || !data){
              var data = {
                id: message_original.user
              };
            }

            data.reaction_notifications = 'true';

            controller.storage.users.save(data, function(err, data) {
              console.log(`saved user ${message_original.user}`, {err}, {data});
            
              bot.api.im.open({
                user: message_original.user
              }, function(message, data){

                var attachments = [
                  {
                    'fallback': 'Unable to render buttons.',
                    'callback_id': 'sidekick_actions',
                    'color': '#3AA3E3',
                    'attachment_type': 'default',
                    'actions': []
                  }
                ];

                attachments[0].actions.push({
                  'name': 'actions',
                  'text': 'Don\'t show reaction notifications',
                  'type': 'button',
                  'value': 'disable_reaction_notifications'
                });

                bot.api.chat.postMessage({
                  channel: data.channel.id,
                  text: `Alrighty!`,
                  attachments: attachments
                }, function(message){
                  // NOOP
                });
              });
            });
          });
        }        
      }
    }
    next();
  });
}


