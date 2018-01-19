/*********************************************************************************
Get to know your Sidekick.

/sidekick help

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js'),
    wordfilter = require('wordfilter'),
    lockdown_status = null;

function explain_sidekick(controller, bot, message){

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
  
  
  controller.storage.teams.all(function(err, all_team_data) {
    lockdown_status = all_team_data[0].lockdown;
    console.log({lockdown_status});

    helpers.is_admin(bot, message, function(err){
      attachments[0].actions.push({
        'name': 'actions',
        'text': 'Who\'s online?',
        'type': 'button',
        'value': 'learn_more'
      });
      
      if (!err){
        attachments[0].actions.push({
          'name': 'actions',
          'text': 'See active members',
          'type': 'button',
          'value': 'see_active_members'
        });    
      }
      
      attachments[0].actions.push({
        'name': 'actions',
        'text': 'Our bots',
        'type': 'button',
        'value': 'learn_more_bots'
      });

      if (err){
        attachments[0].actions.push({
          'name': 'actions',
          'text': 'Contact moderators',
          'type': 'button',
          'value': 'contact_moderators'
        });      
      }
      
      // if (!err){
      //   attachments[0].actions.push(
      //     {
      //       'name': 'actions',
      //       'text': 'Cleanup*',
      //       'type': 'button',
      //       'value': 'show_cleanup_menu'
      //     }
      //   );
      // }

      
      if (!err){
        attachments[0].actions.push(
          {
            'name': 'actions',
            'text': 'Moderator commands',
            'type': 'button',
            'value': 'moderator_commands'
          }
        );
      }

      if (!err && lockdown_status === false){
        attachments[0].actions.push(
          {
            'name': 'actions',
            'text': 'Lockdown',
            'style': 'danger',
            'type': 'button',
            'value': 'lockdown_activate',
            'confirm': {
              'title': 'Are you sure?',
              'text': 'This will prevent members from posting any messages.',
              'ok_text': 'Go ahead',
              'dismiss_text': 'Never mind'
            }
          }
        );
      }

      if (!err && lockdown_status === true){
        attachments[0].actions.push(
          {
            'name': 'actions',
            'text': 'Cancel lockdown',
            'style': 'danger',
            'type': 'button',
            'value': 'lockdown_deactivate',
            'confirm': {
              'title': 'Are you sure?',
              'text': 'Please confirm that you want to cancel the lockdown.',
              'ok_text': 'Confirm',
              'dismiss_text': 'Not yet'
            }
          }
        );
      }

      if (err){
        attachments[0].actions.push({
          'name': 'actions',
          'text': 'Delete my account',
          'style': 'danger',
          'type': 'button',
          'value': 'delete_account',
          'confirm': {
            'title': 'Are you sure?',
            'text': 'You can always contact stefan@botwiki.org to re-activate your account.',
            'ok_text': 'Yes',
            'dismiss_text': 'No'
          }
        });
      }    
      
      bot.api.chat.postEphemeral({
        channel:message.channel,
        user: message.user,
        text: 'Hi, I\'m Sidekick! How can I help?',
        'attachments': attachments
      }, function(err, data){
        console.log({err, data});
      });    
    });


  });  
}

module.exports = function(controller) {  
  controller.hears([
    'who are you',
    'what can you do',
    'hello',
    'help',
    'manual'
  ], 'direct_message,direct_mention', function(bot, message) {
      var message_original = message;
      if (!wordfilter.blacklisted(message.match[1])) {
        explain_sidekick(controller, bot, message);
      } else {
        bot.reply(message, '_sigh_');
      }
  });    
  
  controller.on('slash_command', function(bot, message) {
    bot.replyAcknowledge();

    var {command, args} = helpers.parse_slash_command(message);

    if (command === '' || command === 'help'){
      explain_sidekick(controller, bot, message);
    }
  });


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


