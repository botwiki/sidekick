/*
  TODO: This will need a cleanup as the Twitter Webhooks API continues to develop.
*/
var path = require('path'),
    bodyParser = require('body-parser'),
    request = require('request'),
    crypto = require('crypto'),
    util = require('util'),
    Twit = require('twit'),
    twitter_config = {
      consumer_key: process.env.twitter_consumer_key,
      consumer_secret: process.env.twitter_consumer_secret,
      access_token: process.env.twitter_access_token,
      access_token_secret: process.env.twitter_access_token_secret
    },
    T = new Twit(twitter_config),
    twitter = require(__dirname + '/../../twitter.js');

module.exports = function(webserver, controller) {
  webserver.use(bodyParser.urlencoded({ extended: false }));
  webserver.use(bodyParser.json());

  
  webserver.get('/twitter-webhooks', function(req, res) {
/* Handle crc_token. */
  var res = res,
      crc_token = req.param('crc_token');

  if (crc_token){
    console.log({crc_token});
    var response_token = `sha256=${crypto.createHmac('sha256', twitter_config.consumer_secret).update(crc_token).digest('base64')}`;

    console.log({response_token});
    res.send(JSON.stringify({
      'response_token': response_token
    }));
  }
  else{
    console.log('no crc_token, registering webhook url');
    twitter.register_webhook(res, function(err){
      // NOOP
    })
  }
});
  
webserver.post('/twitter-webhooks', function (req, res) {
  /* Handle webhook requests. */
  console.log('received new webhook request');
  /* Uncomment the line below to see the full object that was sent to us. */
  console.log(util.inspect(req.body, false, null));
  if (req.body.direct_message_events){
    var message = req.body.direct_message_events[0],
        users = req.body.users;
    
    switch (message.type){
      case 'message_create':
        var message_id = message.id,
            sender_id = message.message_create.sender_id,
            sender_screen_name = users[sender_id].screen_name,
            sender_name = users[sender_id].name,
            message_text = message.message_create.message_data.text,
            message_entities = message.message_create.message_data.entities,
            quick_reply_response = message.message_create.message_data.quick_reply_response;
        /*
            message_entities = { hashtags: [], symbols: [], user_mentions: [], urls: [] } 
        */
        
        if (sender_screen_name !== process.env.twitter_screen_name){
          /* Twitter sends data about every message being sent, so we need to check if the bot is the sender. */
          console.log(`new direct message from ${sender_name} (@${sender_screen_name}): > ${message_text}`);
          
        /*
        TODO:
        if (quick_reply_response.metadata){
          if (quick_reply_response.metadata === 'twitter_qr_submit_bot')
        }

        */          

          twitter.is_whitelisted(sender_id, function(err){
            if (message_text && message_text.indexOf('https://t.co/') > -1){
              // a tweet was shared via DM
              var url_regex = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);

              var tweet_url = message_text.match(url_regex)[0];

              var r = request.get(tweet_url, function (err, res, body) {
                if (r !== undefined){
                  twitter.retweet(twitter.get_tweet_id_from_tweet_url(r.uri.href), function(err){
                    if (err){
                      console.log({err});
                    } else {
                      twitter.dm(sender_id, 'Retweeted!');
                    }
                  });
                }
              });
            } 

            var command = '';

            try{
              command = message_text.toLowerCase().split(' ')[0];
            }
            catch(err){ /* noop */ }

            if (command === 'submit' || command === '!submit'){
              var r = request.get(tweet_url, function (err, res, body) {
                if (r !== undefined){
                  var tweet_id = twitter.get_tweet_id_from_tweet_url(r.uri.href),
                      tweet_username = twitter.get_user_id_from_tweet_url(r.uri.href);

                  twitter.prompt_submit(tweet_username, tweet_id);
                  twitter.dm(sender_id, 'Asked to person to submit their bot.');
                }
              });
            }
          });
        }
        else {
          console.log('the bot sent a message');
        }
        break;
      }   
    }
});  
}
