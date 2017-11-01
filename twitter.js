var fs = require('fs'),
    qs = require('qs'),
    path = require('path'),
    request = require('request'),
    helpers = require(__dirname + '/helpers.js'),
    Twit = require('twit'),
    twitter_config = {
      consumer_key: process.env.twitter_consumer_key,
      consumer_secret: process.env.twitter_consumer_secret,
      access_token: process.env.twitter_access_token,
      access_token_secret: process.env.twitter_access_token_secret
    },
    T = new Twit(twitter_config),
    stream, user_stream, slackbot;


var posted_links_file_path = path.join(__dirname, '.data', 'posted_links.txt'),
    posted_links = [];

fs.readFile(posted_links_file_path, 'utf8', function (err, data) {
  if (err){
    fs.open(posted_links_file_path, 'wx', function (err, fd) {
      // TODO: handle error
      fs.close(fd, function (err) {
      // TODO: handle error
      });
    });
  }
  else if(data.length > 0){
    posted_links = data.split('\n');
  }
  console.log(`reloaded ${posted_links_file_path} (${posted_links.length})`)
});

function retweet(tweet_id){
  console.log(`retweeting tweet ${tweet_id}...`);
}

function update_posted_links(){
  fs.writeFile(posted_links_file_path, posted_links.join('\n'), function (err) {
    if (err){
      console.log(`unable to update ${posted_links_file_path}...`, {err});
    }
    else{
      console.log(`updated ${posted_links_file_path}`);      
    }
  });  
}

function post_to_feed(tweet){
  var tweet_url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
  //tweet.id_str
  //tweet.text
  // console.log(`forwarding to #the-feed...\n`, tweet_url);
  // console.log(`forwarding to #the-feed...\n`, {tweet});
  console.log(`forwarding to #the-feed...\n`, tweet.text, tweet.entities.urls);
  
  var re = /((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*/gi;
  var tweet_text_parsed = tweet.text, result, ind = 0;
  while((result = re.exec(tweet.text)) !== null) {
    if (tweet.entities.urls[ind].expanded_url){      
      console.log(ind, result[0], tweet.entities.urls[ind].expanded_url);
      tweet_text_parsed = tweet_text_parsed.replace(result[0], tweet.entities.urls[ind].expanded_url)
      ind++;
    }
  }
 
  slackbot.api.chat.postMessage({
    channel: process.env.channel_twitter_feed,
    // title: '',
    // text: tweet_url,
    attachments: [
          {
            'text': tweet_text_parsed,
            'author_name': `@${tweet.user.screen_name}`,
            'author_link': `https://twitter.com/@${tweet.user.screen_name}`,
            'author_icon': tweet.user.profile_image_url_https,
            'footer': tweet_url,
            // 'footer_icon': 'https://platform.slack-edge.com/img/default_application_icon.png',
            'fallback': `@${tweet.user.screen_name}: ${tweet_text_parsed}`,
            'callback_id': 'sidekick_actions',
            'color': '#e8e8e8',
            'attachment_type': 'default',
            'actions': [
               {
                  'name': 'retweet',
                  'text': 'Retweet',
                  'type': 'button',
                  'value': tweet.id_str,
                  'confirm': {
                    'title': 'Please confirm',
                    'text': `Are you sure you want to retweet this tweet from @${tweet.user.screen_name}?`,
                    'ok_text': 'Yes',
                    'dismiss_text': 'No'
                  }
                },
                {
                  'name': 'forward',
                  'text': 'Forward',
                  'type': 'button',
                  'value': `forward_dialog!${tweet_url}`
                },
                {
                  'name': 'ignore',
                  'text': 'Ignore user',
                  'style': 'danger',
                  'type': 'button',
                  'value': tweet.user.screen_name,
                  'confirm': {
                    'title': 'Please confirm',
                    'text': `Are you sure you want to mute tweets from @${tweet.user.screen_name}?`,
                    'ok_text': 'Yes',
                    'dismiss_text': 'No'
                  }
                }              
            ]
          }
        ]
    
  },function(err){
    if (err){
      console.log({err});
    }
  }); 

}

module.exports = {
  init: function(controller){
    var twitter = this;
    console.log('reloading twitter module...');
/*

    twitter.update_welcome_message({
      'text': [
        'Hey there!',
        'If you\'d like to submit your bot to Botwiki, check out http://botwiki.org/submit-your-bot .',
        'And be sure to join other us at http://botmakers.org  and subscribe to http://botzine.org !',
        'Anything else we can help you with? :-)'
      ].join('\n\n'),
      // 'quick_reply': {
      //   'type': 'options',
      //   'options': [
      //     {
      //       'label': 'Hello 👋',
      //       'description': 'Saying hello.',
      //       'metadata': 'twitter_qr_hello'
      //     },
      //     {
      //       'label': 'Submit my bot',
      //       'description': 'How do I submit my bot to Botwiki?',
      //       'metadata': 'twitter_qr_submit_bot'
      //     },
      //     {
      //       'label': 'Join Botmakers',
      //       'description': 'How do I join Botmakers?',
      //       'metadata': 'twitter_qr_join_botmakers'
      //     },
      //     {
      //       'label': 'Support Botwiki/Botmakers',
      //       'description': 'How can I support Botwiki and Botmakers?',
      //       'metadata': 'twitter_qr_support'
      //     }
      //   ]
      // }

    }, function(err){
      console.log({err})
    })
*/
    
    try{
      stream.stop();      
    }catch(err){
      //NOOP
    };

    controller.storage.teams.all(function(err, all_team_data) {

      slackbot = controller.spawn({token: all_team_data[0].token});
      
      var keywords = {
        tracked: all_team_data[0].tracked,
        ignored: all_team_data[0].ignored
      }

      stream = T.stream('statuses/filter', { track: keywords.tracked});
      user_stream = T.stream('user');

      // console.log({keywords});
      
      stream.on('tweet', function (tweet) {
        // console.log({tweet});
        if ('retweeted_status' in tweet){
          return false;
        }        
        var tweet_url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
            tweet_text_normalized = tweet.text.trim().toLowerCase();
        
        console.log({
          tweet_url: tweet_url,          
          tweet_user_screen_name: tweet.user.screen_name,
          tweet_text: tweet.text
        });
        
        var can_tweet = true;
        
        console.log('checking tweet against ignored keywords...');
        
        keywords.ignored.forEach(function(keyword){
          if (keyword.charAt(0) === '@' && `@${tweet.user.screen_name}` === keyword){
            console.log(`@${tweet.user.screen_name} is blocked...`);
            can_tweet = false;
            return false;
          }
          else if (tweet_text_normalized.indexOf(keyword.trim().toLowerCase()) > -1){
            console.log(`"${keyword}" is blocked...`);
            can_tweet = false;
            return false;
          } 
        });

        if (can_tweet){
          can_tweet = false;
          console.log('checking tweet against tracked keywords...');

          keywords.tracked.forEach(function(keyword){
            // console.log(`checking tweet against "${keyword}"...`);
            if (keyword.charAt(0) !== '@' && tweet_text_normalized.indexOf(keyword) > -1){
              can_tweet = true;
              return false;
            }
          });
        }
        if (can_tweet){
          var new_links = [];

          for (var i = 0, j = tweet.entities.urls.length; i < j; i++){
            new_links.push(tweet.entities.urls[i].expanded_url.replace(/\\\//gi, '/'))
          }   

          if (new_links.length > 0){
            console.log('detected URL(s) in tweet:\n', new_links);
            var new_link = new_links.shift(); /*TODO: For now, only checking the first posted URL, most common scenario. */

            var r = request(new_link, function (e, response) {
              if (response && response.request){
                var final_url = helpers.get_path_from_url(response.request.uri.href);
              }
              else{
                final_url = helpers.get_path_from_url(new_link);
              }
              // console.log({posted_links, final_url});
              if (posted_links.length === 0){
                posted_links.push(final_url);
                update_posted_links();
                console.log('forwarding to the feed channel...');
                post_to_feed(tweet);
                
              }
              else if (posted_links.indexOf(final_url) === -1 && !helpers.check_domain_blacklist(final_url)){
                console.log('found new URL:', final_url);

                posted_links.push(final_url);
                update_posted_links();
                console.log('forwarding to the feed channel...');
                post_to_feed(tweet);

              }
              else{
                console.log('URL already posted, or blacklisted');
              }          
            })
          }
          else{
            console.log('forwarding to the feed channel...');
            post_to_feed(tweet);            
          }
        }
      });
    });
  },
  retweet: function(tweet_id, cb){
    console.log(`retweeting ${tweet_id}...`);
    T.post('statuses/retweet/:id', {
      id: tweet_id
    }, function(err, data, response) {
        console.log('done!', {err});
        if (cb){
          cb(err);
        }
    });    
  },
  dm: function(user_id, text, cb){
    console.log(`sending DM to ${user_id}...`);
    T.post('direct_messages/new', {
      user_id: user_id,
      text: text
    }, function(err, data, response) {
      if (cb){
        cb(err);
      }
    });      
  },
  get_tweet_id_from_tweet_url: function(tweet_url){
    return tweet_url.split('/')[5];
  },
  get_user_id_from_tweet_url: function(tweet_url){
    return tweet_url.split('/')[3];
  },
  is_whitelisted: function(user_id, cb){
    T.get('friends/ids', { screen_name: process.env.twitter_screen_name, stringify_ids: true },  function (err, data, response) {
      if (data.ids && data.ids.indexOf(user_id) > -1){
        if (cb){
          cb(null)
        }
      }
      else{
        cb({
          err: 'not_whitelisted',
          error_message: 'User not whitelisted.'
        });
      }
    });
  },
  prompt_submit: function(tweet_username, tweet_id, cb){
    T.post('statuses/update',{
      in_reply_to_status_id: tweet_id,
      status: `@${tweet_username} Nice! Would you be interested in adding your bot to Botwiki? botwiki.org/submit-your-bot 😊`
    }, function(err, data, response) {
      if (cb){
        cb(err);
      }
    });
  },  
  register_webhook: function(res, cb){
    T.post('account_activity/webhooks', {
      url: `https://${process.env.PROJECT_NAME}.glitch.me/twitter-webhooks`
    }, function(err, data, response) {
      if (err){
        console.log('GET webhooks ERROR (1)\n', {err});
        switch(err.message){
          case 'Too many resources already created.':
            T.get('account_activity/webhooks', {}, function(err, data, response) {
              if (err){
                console.log('GET webhooks ERROR (2)\n', {err});
                if (cb){
                  cb(err);
                }                    
                // res.sendStatus(500);
              }
              else{
                if (data.valid){
                  console.log('webhook url already registered\n', {data});
                  res.sendStatus(200);                
                }
                else{
                  console.log('deleting invalid webhook url...');
                  console.log({data});

                  T.delete(`account_activity/webhooks/${data[0]['id']}`, {}, function(err, data, response) {
                    if (err){
                      console.log('DELETE webhooks ERROR\n', {err});
                      if (cb){
                        cb(err);
                      }                    
                      res.sendStatus(500);
                    }
                    else{
                      console.log('webhook url deleted');
                      /* First, de-register current URL, then redirect to register again. */
                      res.redirect('/twitter-webhooks');
                      if (cb){
                        cb(null);
                      }
                    }
                  });
                }
              }
            });
            break;
          default:
            console.log('error\n', {err});
            res.sendStatus(500);
          break;
        }
      }
      else{
        console.log('webhook url registered, subscribing...\n', {data});

        T.post(`account_activity/webhooks/${data.id}/subscriptions`, { webhook_id : data.id }, function(err, data, response) {
          if (err){
            console.log('GET webhooks ERROR (3)\n', {err});
            res.sendStatus(500);
          }
          else{
            console.log('webhook url registered\n', {data});
            res.sendStatus(200);
          }
        });
      }
    });  
  },
  update_welcome_message: function(wm_object, cb){
    var twitter = this;
    T.get('direct_messages/welcome_messages/rules/list', {}, function(err, data, response) {
      console.log(data.welcome_message_rules);
      if (data.welcome_message_rules && data.welcome_message_rules.length > 0){
        console.log('deleting old welcome message...');
        var old_welcome_message_id = data.welcome_message_rules[0].id;
        T.delete('direct_messages/welcome_messages/rules/destroy', {
          'id': old_welcome_message_id
        }, function(err, data, response) {
          if (err && cb){
            cb(err);
          }
          else{
            twitter.set_welcome_message(wm_object, cb);
          }
        });
      }
      else{
        console.log('no previous welcome message found, updating...');
        twitter.set_welcome_message(wm_object, cb);      
      }
    });
  },
  set_welcome_message: function(wm_object, cb){
    var twitter = this;
    console.log('setting new welcome message...');
    T.post('direct_messages/welcome_messages/new', {
      'welcome_message': {message_data: wm_object}      
    }, function(err, data, response) {
      if (err && cb){
        cb(err)
      }
      else{
        var welcome_message_id = data.welcome_message.id;
        T.post('direct_messages/welcome_messages/rules/new', {
          'welcome_message_rule': {
            'welcome_message_id': welcome_message_id
          }
        }, function(err, data, response) {
          console.log({data});
          if (cb){
            cb(err);
          }
        });
      }
    });
  }  
};
