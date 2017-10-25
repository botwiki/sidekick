/*********************************************************************************
Track tweets that might be of interest.
/sidekick track

*********************************************************************************/

var helpers = require(__dirname + '/../helpers.js'),
    twitter = require(__dirname + '/../twitter.js');
    
module.exports = function(controller) {
  twitter.init(controller);
  
  controller.on('slash_command', function(bot, message) {
    var message_original = message,
        {command, args} = helpers.parse_slash_command(message);

    if (command === 'track'){
      bot.replyAcknowledge();
      
      helpers.is_admin(bot, message, function(err){
        if (err){
          bot.replyPrivate(message, err.error_message);    
        }
        else{
          var tracked_data = [];

          controller.storage.teams.get(message.team_id, function(err, data) {
            if (err){
              console.log('error\n', err);
              helpers.notify(bot, message, 'Error!', err);
            }
            tracked_data = data.tracked;

            if (args[0] === 'list'){
              var attachments = [], attachment = {
                title: 'Tracked keywords',
                color: '#333',
                fields: []
              };

              if (!tracked_data){
                bot.api.chat.postEphemeral({
                  channel:message.channel,
                  user: message.user,
                  text: 'No tracked keywords found.',
                  attachments: JSON.stringify(attachments)
                });
                return false;
              }
              
              tracked_data.forEach(function(data){
                attachment.fields.push({
                  value: data,
                  short: true
                });    
              })

              attachments.push(attachment);

              bot.api.chat.postEphemeral({
                channel:message.channel,
                user: message.user,
                attachments: JSON.stringify(attachments)
              });          
            }
            else if (args[0] === 'remove'){
              // var keywords = args.slice(1).join(' ').match(/\w+|"[^"]+"/g);
              var keywords = args.slice(1).join(' ').match(/[^\s"]+|"([^"]*)"/g);
              keywords = keywords.map(function(keyword){
                return keyword.replace(/"/gi, '');
              })
              tracked_data = tracked_data.filter(function(keyword){
                return keywords.indexOf(keyword) === -1;
              });

              data.tracked = tracked_data;
              controller.storage.teams.save(data, function(err, data) {
                if (err){
                  console.log('error\n', err);
                }
                else{
                  twitter.init(controller);                    

                  bot.api.chat.postEphemeral({
                    channel:message.channel,
                    text: `<@${message.user}> updated tracked keywords.`,
                    attachments: JSON.stringify(attachments)
                  });

                  var attachments = [], attachment = {
                    color: '#333',
                    fields: []
                  };

                  tracked_data.forEach(function(data){
                    attachment.fields.push({
                      value: data,
                      short: true
                    });
                  })

                  attachments.push(attachment);

                  bot.api.chat.postEphemeral({
                    channel:message.channel,
                    user: message.user,
                    text: 'Updated tracked keywords.',
                    attachments: JSON.stringify(attachments)
                  });
                }              
              });
            }
            else{
              // var keywords = args.join(' ').match(/\w+|"[^"]+"/g);
              var keywords = args.join(' ').match(/[^\s"]+|"([^"]*)"/g);
              if (!keywords || !keywords.length){

                var attachments = [], attachment = {
                  title: 'Tracking keywords',
                  color: '#333',
                  fields: [],
                  mrkdwn_in: ['fields']
                };
                
                attachment.fields.push(
                  {
                    value: '`/sidekick track list`'
                  },
                  {
                    value: '`/sidekick track KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`'
                  },
                  {
                    value: '`/sidekick remove KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`'
                  }
                );

                attachments.push(attachment);

                bot.api.chat.postEphemeral({
                  channel:message.channel,
                  user: message.user,
                  text: 'Here\'s how you can use the `/sidekick track` command.',
                  attachments: JSON.stringify(attachments)
                }); 
              }
              else{
                keywords = keywords.map(function(keyword){
                  return keyword.replace(/"/gi, '');
                })

                if (!tracked_data || tracked_data.length === 0){
                  tracked_data = keywords;
                }
                else{
                  keywords.forEach(function(keyword){
                    if (tracked_data.indexOf(keyword) === -1){
                      tracked_data.push(keyword);
                    }  
                  })
                }

                data.tracked = tracked_data;
                controller.storage.teams.save(data, function(err, data) {
                  if (err){
                    console.log('error\n', err);
                  }
                  else{
                    twitter.init(controller);
                    
                    bot.api.chat.postEphemeral({
                      channel:message.channel,
                      text: `<@${message.user}> updated tracked keywords.`,
                      attachments: JSON.stringify(attachments)
                    });                    
                    
                    var attachments = [], attachment = {
                      color: '#333',
                      fields: []
                    };

                    tracked_data.forEach(function(data){
                      attachment.fields.push({
                        value: data,
                        short: true
                      });
                    })

                    attachments.push(attachment);

                    bot.api.chat.postEphemeral({
                      channel:message.channel,
                      user: message.user,
                      text: 'Updated tracked keywords.',
                      attachments: JSON.stringify(attachments)
                    });
                  }              
                });                
              }
            }
          });
        }
      });          
    }
    else if (command === 'ignore'){
      bot.replyAcknowledge();
      
      helpers.is_admin(bot, message, function(err){
        if (err){
          bot.replyPrivate(message, err.error_message);    
        }
        else{
          var ignored_data = [];

          controller.storage.teams.get(message.team_id, function(err, data) {
            if (err){
              console.log('error\n', err);
              helpers.notify(bot, message, 'Error!', err);
            }
            ignored_data = data.ignored;

            if (args[0] === 'list'){
              var attachments = [], attachment = {
                title: 'Ignored keywords',
                color: '#333',
                fields: []
              };
              
              if (!ignored_data || ignored_data.length === 0){
                bot.api.chat.postEphemeral({
                  channel:message.channel,
                  user: message.user,
                  text: 'No ignored keywords found.',
                  attachments: JSON.stringify(attachments)
                });
                return false;
              }

              ignored_data.forEach(function(data){
                attachment.fields.push({
                  value: data,
                  short: true
                });    
              })

              attachments.push(attachment);

              bot.api.chat.postEphemeral({
                channel:message.channel,
                user: message.user,
                attachments: JSON.stringify(attachments)
              });          
            }
            else if (args[0] === 'remove'){
              // var keywords = args.slice(1).join(' ').match(/\w+|"[^"]+"/g);
              var keywords = args.slice(1).join(' ').match(/[^\s"]+|"([^"]*)"/g);
              keywords = keywords.map(function(keyword){
                return keyword.replace(/"/gi, '');
              })
              ignored_data = ignored_data.filter(function(keyword){
                return keywords.indexOf(keyword) === -1;
              });

              data.ignored = ignored_data;
              controller.storage.teams.save(data, function(err, data) {
                if (err){
                  console.log('error\n', err);
                }
                else{
                  twitter.init(controller);

                  bot.api.chat.postMessage({
                    channel:message.channel,
                    text: `<@${message.user}> updated ignored keywords.`
                  });

                  var attachments = [], attachment = {
                    color: '#333',
                    fields: []
                  };

                  ignored_data.forEach(function(data){
                    attachment.fields.push({
                      value: data,
                      short: true
                    });
                  })

                  attachments.push(attachment);

                  bot.api.chat.postEphemeral({
                    channel:message.channel,
                    user: message.user,
                    text: 'Updated ignored keywords.',
                    attachments: JSON.stringify(attachments)
                  });
                }              
              });
            }
            else{
              // var keywords = args.join(' ').match(/\w+|"[^"]+"/g);
              var keywords = args.join(' ').match(/[^\s"]+|"([^"]*)"/g);
              if (!keywords || !keywords.length){

                var attachments = [], attachment = {
                  title: 'Ignoring keywords',
                  color: '#333',
                  fields: [],
                  mrkdwn_in: ['fields']
                };
                
                attachment.fields.push(
                  {
                    value: '`/sidekick ignore list`'
                  },
                  {
                    value: '`/sidekick ignore KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`'
                  },
                  {
                    value: '`/sidekick ignore remove KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`'
                  }
                );

                attachments.push(attachment);

                bot.api.chat.postEphemeral({
                  channel:message.channel,
                  user: message.user,
                  text: 'Here\'s how you can use the `/sidekick ignore` command.',
                  attachments: JSON.stringify(attachments)
                }); 
              }
              else{
                keywords = keywords.map(function(keyword){
                  return keyword.replace(/"/gi, '');
                })

                if (!ignored_data || ignored_data.length === 0){
                  ignored_data = keywords;
                }
                else{
                  keywords.forEach(function(keyword){
                    if (ignored_data.indexOf(keyword) === -1){
                      ignored_data.push(keyword);
                    }  
                  })
                }

                // controller.storage.teams.save({id: message.team_id, ignored: ignored_data}, function(err, data) {
                data.ignored = ignored_data;
                controller.storage.teams.save(data, function(err, data) {
                  if (err){
                    console.log('error\n', err);
                  }
                  else{
                    twitter.init(controller);

                    bot.api.chat.postMessage({
                      channel:message.channel,
                      text: `<@${message.user}> updated ignored keywords.`
                    });
                    
                    var attachments = [], attachment = {
                      color: '#333',
                      fields: []
                    };

                    ignored_data.forEach(function(data){
                      attachment.fields.push({
                        value: data,
                        short: true
                      });
                    })

                    attachments.push(attachment);

                    bot.api.chat.postEphemeral({
                      channel:message.channel,
                      user: message.user,
                      text: 'Updated ignored keywords.',
                      attachments: JSON.stringify(attachments)
                    });
                  }              
                });                
              }
            }
          });
        }
      });          
    }
  });
}
