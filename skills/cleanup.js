/*********************************************************************************

Cleanup time! This helps the moderator figure out which accounts are no longer used.

/sidekick cleanup

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js'),
    wordfilter = require('wordfilter');

function start_cleanup(bot, message){
  bot.api.chat.postEphemeral({
    channel:message.channel,
    user: message.user,
    text: 'Time to clean up?',
    'attachments': [
      {
        'fallback': 'Unable to render buttons.',
        'callback_id': 'sidekick_actions',
        'color': '#3AA3E3',
        'attachment_type': 'default',
        'actions': [
          {
            'name': 'actions',
            'text': 'Start cleanup',
            'style': 'danger',
            'type': 'button',
            'value': 'start_cleanup',
            'confirm': {
              'title': 'Are you sure?',
              'text': 'This will send a message to every member of the group.',
              'ok_text': 'Yep',
              'dismiss_text': 'Never mind'
            }
          },
          {
            'name': 'actions',
            'text': 'See active members',
            'type': 'button',
            'value': 'see_active_members'
          },
          {
            'name': 'actions',
            'text': 'Remove inactive members',
            'style': 'danger',
            'type': 'button',
            'value': 'remove_inactive_members',
            'confirm': {
              'title': 'Are you sure?',
              'text': 'Please confirm.',
              'ok_text': 'Yep',
              'dismiss_text': 'Never mind'
            }
          }          
        ]
      }
    ]

  }, function(err, data){
    console.log({err, data});
  });    
}

module.exports = function(controller) { 
  controller.on('slash_command', function(bot, message) {
    bot.replyAcknowledge();

    var {command, args} = helpers.parse_slash_command(message);

    if (command === '' || command === 'cleanup'){
      start_cleanup(bot, message);
    }
  });


  controller.middleware.receive.use(function(bot, message, next) {
    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      if (message.actions[0].name === 'actions') {
        if (message.actions[0].value === 'start_cleanup') {
          helpers.is_admin(bot, message, function(err){
            if (err){
              bot.api.chat.postEphemeral({
                channel: message_original.channel,
                user: message_original.user,
                text: err.error_message
              });
            } else {
              bot.api.users.list({}, function(err, data){
                if (!err && data.members){

                  bot.api.chat.postEphemeral({
                    channel: message_original.channel,
                    user: message_original.user,
                    text: 'processing...'
                  });
                  
                  var members = data.members.filter(function(member){
                    // return !member.deleted;
                    return member.id ==='U0AQUMPSP';
                  });
                  
                  console.log(`processing ${members.length} member(s)...`);
                  
                  members.forEach(function(member, index) {
                    setTimeout(function(){
                      console.log(member);
                      
                       bot.api.im.open({
                          user: member.id
                        }, function(message, data){
                          bot.api.chat.postMessage({
                            channel: data.channel.id,
                            text: 'Hi there :wave:\n\nWe are doing a small cleanup of inactive accounts. Please let us know if you\'re still using this account.\n\nThank you!',
                            'attachments': [
                              {
                                'fallback': 'Unable to render buttons.',
                                'callback_id': 'sidekick_actions',
                                'color': '#3AA3E3',
                                'attachment_type': 'default',
                                'actions': [
                                  {
                                    'name': 'actions',
                                    'text': 'Keep me in Botmakers',
                                    'type': 'button',
                                    'value': 'mark_active'
                                  }
                                ]
                              }
                            ]
                          }, function(message){
                            // NOOP
                          });
                        });   
                                         
                      if (index === (members.length - 1)){
                        bot.api.chat.postEphemeral({
                          channel: message_original.channel,
                          user: message_original.user,
                          text: 'done!'
                        });
                      }
                    }, index * 1000);
                  }); 
                }
              });
            }
          });
        }
        else if (message.actions[0].value === 'mark_active') {
          console.log(`marking user ${message_original.user} as active...`);

          controller.storage.users.get(message_original.user, function(err, data) {
            data.last_active = Math.round((new Date()).getTime() / 1000);
            controller.storage.users.save(data, function(err, data) {
              //NOOP
            });
          });
        }
        else if (message.actions[0].value === 'see_active_members') {
          console.log('retrieving...');
          /* TODO: retrieve active/inactive users */
        }
        else if (message.actions[0].value === 'remove_inactive_members') {
          console.log('retrieving...');
          /* TODO: deactivate inactive users */
        }
      }
    }
    next();
  });
}


