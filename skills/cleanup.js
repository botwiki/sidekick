/*********************************************************************************

Cleanup time! This helps the moderator figure out which accounts are no longer used.

/sidekick cleanup

*********************************************************************************/

var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js'),
    moment = require('moment'),
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
  controller.on('ambient', function(bot, message){
    helpers.update_last_active_time(controller, bot, message.user, 'now');
  });

  controller.on('team_join', function(bot, message) {
    console.log('team_join', message);
    helpers.update_last_active_time(controller, bot, message.user, 'now');    
  });
  
  controller.on('reaction_added', function(bot, message){    
    helpers.update_last_active_time(controller, bot, message.user, 'now');
  });
  
  controller.on('slash_command', function(bot, message) {
    bot.replyAcknowledge();

    var {command, args} = helpers.parse_slash_command(message);

    if (command === 'cleanup'){
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
                    return !member.deleted;
                    // return ['U0AQUMPSP'].indexOf(member.id) > -1;
                  });
                  
                  console.log(`processing ${members.length} member(s)...`);
                  
                  members.forEach(function(member, index) {
                    if (!member.is_bot){

                      setTimeout(function(){
                         bot.api.im.open({
                            user: member.id
                          }, function(message, data){
                            bot.api.chat.postMessage({
                              channel: data.channel.id,
                              text: 'Hi there :wave:\n\nWe are doing a small cleanup of inactive accounts. Please let us know if you\'re still using this account. (If not, you can ignore this message.)\n\nThank you!',
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

                    }
                  }); 
                }
              });
            }
          });
        }
        else if (message.actions[0].value === 'mark_active') {
          console.log(`marking user ${message_original.user} as active...`);

          controller.storage.users.get(message_original.user, function(err, data) {
            console.log(`loading user data for ${message_original.user}...`, {err}, {data});

            if (err || !data){
              var data = {
                id: message_original.user
              };
            }

            data.last_active = moment().format();

            console.log(`loaded data for user ${message_original.user}...`, {data});

            controller.storage.users.save(data, function(err, data) {
                console.log(`saved user ${message_original.user}`, {err}, {data});
              
                var reply = message_original;
                reply.text = 'Thank you!';
              
                bot.replyInteractive(message_original, reply);              
              
                // bot.api.im.open({
                //   user: message_original.user
                // }, function(message, data){
                //   bot.api.chat.postMessage({
                //     channel: data.channel.id,
                //     text: 'Thank you!'
                //   }, function(message){
                //     // NOOP
                //   });
                // });  
            });
          });
          
        }
        else if (message.actions[0].value === 'see_active_members') {          
          console.log('retrieving...');
          var attachments = [], attachment = {
            title: 'Active members',
            color: '#36a64f',
            fields: [],
            mrkdwn_in: ['text,fields']
          };

          bot.api.users.list({}, function(err, data){
            if (!err && data.members){
              var active_users = [], inactive_users = [], deleted_users = [];

              active_users = data.members.filter(function(member){
                return 
              });

              var actions = data.members.map(function(member){
                var action = new Promise(function(resolve, reject) {
                  if (member.deleted){
                    resolve(null);
                  }
                  else{
                    controller.storage.users.get(member.id, function(err, data) {
                      if (data && data.last_active){
                        member.__last_active = data.last_active;
                      }
                      resolve(member);
                    });
                  }
                });

                return action;
              });
              
    

              var results = Promise.all(actions);

              results.then(function (values) {
                values.forEach(function(member){                

                  if (member && member.__last_active && moment().diff( member.__last_active, 'days') < 32){
                    active_users.push(member);
                  }
                  else {
                    inactive_users.push(member);
                  }
                });


                active_users = active_users.sort(function(a, b){
                  if (a && b && a.hasOwnProperty('__last_active') && b.hasOwnProperty('__last_active') && moment().diff( a.__last_active, 'minutes') < moment().diff( b.__last_active, 'minutes')){
                    return -1;
                  }
                  else if (a && b && a.hasOwnProperty('__last_active') && b.hasOwnProperty('__last_active') && moment().diff( a.__last_active, 'minutes') > moment().diff( b.__last_active, 'minutes')){
                    return 1;
                  }
                  else {
                    return 0;
                  }
                });

                active_users.forEach(function(member){
                  attachment.fields.push({
                    'value': `<@${member.name}> (${moment(member.__last_active).fromNow()})`,
                    'thumb_url': member.profile.image_192,
                    'short': true
                  });
                });

                attachment.title = `There are ${helpers.number_with_commas(active_users.length)} active Botmakers members:`;

                attachment.fields.push({
                  value: `Also, there are ${helpers.number_with_commas(inactive_users.length + deleted_users.length)} inactive and deleted accounts.`
                });

                attachments.push(attachment);

                bot.api.chat.postEphemeral({
                  channel: message.channel,
                  user: message.user,
                  text: 'Here you go!',
                  attachments: attachments    
                });
              });          
            }
          });
        }
        else if (message.actions[0].value === 'remove_inactive_members') {
          console.log('cleaning up...');
          /* TODO: deactivate inactive users */
        }
        else if (message.actions[0].value === 'show_cleanup_menu') {
          start_cleanup(bot, message);
        }
        
      }
    }
    next();
  });
}


