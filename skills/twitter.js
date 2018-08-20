/*********************************************************************************
Track tweets that might be of interest.
/sidekick track

*********************************************************************************/

var helpers = require(__dirname + '/../helpers.js'),
    twitter = require(__dirname + '/../twitter.js'),
    channel_ids = require(__dirname + '/../channel_ids.js');
    
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
                  channel: message.channel,
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
                channel: message.channel,
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
                    channel: message.channel,
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
                    channel: message.channel,
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
                  channel: message.channel,
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
                      channel: message.channel,
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
                      channel: message.channel,
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
                  channel: message.channel,
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
                channel: message.channel,
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
                    channel: message.channel,
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
                    channel: message.channel,
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
                  channel: message.channel,
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
                      channel: message.channel,
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
                      channel: message.channel,
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
  

  controller.middleware.receive.use(function(bot, message, next) {
    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      // console.log('message_actions\n', message);
      var original_message = message;

      function retweet(bot, original_message, message, submit_prompt){

        helpers.is_admin(bot, message, function(err){
          if (err){
            bot.api.chat.postEphemeral({
              channel: original_message.channel,
              user: original_message.user,
              text: err.error_message
            });
          }
          else{
            // console.log('retweet', original_message.actions[0].value);
            twitter.retweet(original_message.actions[0].value, function(err){
              if (err){
                console.log('Unable to retweet.', {err})
                if (err.message){
                  
                  var attachments = [], attachment = {
                    color: '#ED5565',
                    fields: []
                  };

                  attachment.fields.push({
                    value: err.message
                  });

                  attachments.push(attachment);

                  bot.api.chat.postEphemeral({
                    channel: original_message.channel,
                    user: original_message.user,
                    text: 'Unable to retweet.',
                    attachments: JSON.stringify(attachments)
                  });                  
                }
              } 
              else{
                // bot.api.chat.postEphemeral({
                //   channel: original_message.channel,
                //   user: original_message.user,
                //   text: 'Retweeted :thumbsup:'
                // });
                if (submit_prompt === true){
                    twitter.prompt_submit(null, original_message.actions[0].value);                
                }
                bot.api.chat.postMessage({
                  channel: original_message.channel,
                  text: `<@${original_message.user}> Retweeted :thumbsup:`
                });                                
              }
            });
          }
        });
      }

      if (original_message.actions[0].name === 'retweet') {
        retweet(bot, original_message, message, false);
      }
      else if (original_message.actions[0].name === 'retweet_submit') {
        retweet(bot, original_message, message, true);
      }
      // else if (message.actions[0].value === 'forward_dialog') {
      else if (message.actions[0].value.indexOf('forward_dialog') > -1) {
        var tweet_url = message.actions[0].value.split('!')[1];
        bot.api.dialog.open({
          trigger_id: message.trigger_id,
          dialog: JSON.stringify({
            'callback_id': 'forward_message',
            'title': 'Forward message',
            'submit_label': 'Forward',
            'elements': [
              {
                'label': 'Tweet URL',
                'name': 'tweet_url',
                'type': 'text',
                'subtype' : 'url',
                'subtype': 'email',
                'value': tweet_url
              },              
              {
                'label': 'Choose channel',
                'type': 'select',
                'name': 'forward_channel_select',
                'placeholder': '#channel',
                'value': 'forward_channel',
                'options': [
                  {
                    'label': '#news',
                    'value': 'news'
                  },
                  {
                    'label': '#projects',
                    'value': 'projects'
                  },
                  {
                    'label': '#events',
                    'value': 'events'
                  },
                  {
                    'label': '#ideas',
                    'value': 'ideas'
                  },
                  {
                    'label': '#jobs',
                    'value': 'jobs'
                  }                  
                ]
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
      else if (original_message.actions[0].name === 'forward_news') {
        console.log('forward to #', original_message.actions[0].value);
        bot.api.chat.postMessage({
          channel: channel_ids.news,
          text: `<@${original_message.user}> found this in <#${channel_ids.twitter_feed}>: ${original_message.actions[0].value}`         
        });          
      }
      else if (original_message.actions[0].name === 'forward_projects') {
        console.log('forward to #', original_message.actions[0].value);
        bot.api.chat.postMessage({
          channel: channel_ids.projects,
          text: `<@${original_message.user}> found this in <#${channel_ids.twitter_feed}>: ${original_message.actions[0].value}`         
        });          
      }
      else if (original_message.actions[0].name === 'ignore') {
        helpers.is_admin(bot, message, function(err){
          if (err){
            bot.api.chat.postEphemeral({
              channel: original_message.channel,
              user: original_message.user,
              text: err.error_message
            });
          }
          else{
            var ignored_username = `@${original_message.actions[0].value}`;

            controller.storage.teams.get(original_message.team.id, function(err, data) {
              if (err){
                console.log('error\n', err);
                helpers.notify(bot, message, 'Error!', err);
              }
              
              var ignored_data = data.ignored;

              if (ignored_data.indexOf(ignored_username) === -1){
                ignored_data.push(ignored_username);
              }            

              data.ignored = ignored_data;
              controller.storage.teams.save(data, function(err, data) {
                if (err){
                  console.log('error\n', err);
                }
                else{
                  twitter.init(controller);

                  bot.api.chat.postMessage({
                    channel: original_message.channel,
                    text: `<@${original_message.user}> updated ignored keywords.`
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
                    channel: original_message.channel,
                    user: original_message.user,
                    text: 'Updated ignored keywords.',
                    attachments: JSON.stringify(attachments)
                  });
                }              
              });
            })
          }
        });       
      }
    }
    next();
  });
}
