var helpers = require(__dirname + '/../helpers.js'),
    twitter = require(__dirname + '/../twitter.js'),
    channel_ids = require(__dirname + '/../channel_ids.js');

module.exports = function(controller) {
  controller.middleware.receive.use(function(bot, message, next) {
    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      // console.log('message_actions\n', message);
      var original_message = message;

      if (original_message.actions[0].name === 'retweet') {
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
                bot.api.chat.postMessage({
                  channel: original_message.channel,
                  text: `<@${original_message.user}> Retweeted :thumbsup:`
                });                                
              }
            });
          }
        });
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
                'label': 'Choose channel.',
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
