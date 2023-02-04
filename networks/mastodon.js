const fs = require("fs"),
    qs = require('qs'),
    path = require('path'),
    request = require('request'),
    helpers = require(__dirname + '/../helpers.js'),
    Mastodon = require("mastodon");


let M;

try {
  M = new Mastodon({
    access_token: process.env.MASTODON_ACCESS_TOKEN,
    api_url: process.env.MASTODON_API || "https://mastodon.social/api/v1/",
  });
  console.log("ready to toot!");
} catch (err) {
  console.error(err);
  console.error("please update your .env file");
}

module.exports = {
  M: M,
  toot: (status, cb) => {
    if (!M) {
      console.error("please update your .env file");
      return false;
    }
    if (status.length > 500) {
      console.error(`status too long: ${status}`);
      return false;
    }

    console.log("tooting!");
    M.post("statuses", { status: status }, (err, data, response) => {
      console.log(`posted status: ${status}`);
    });

    if (cb) {
      cb(null);
    }
  },
  postImage: (text, img_file, cb) => {
    M.post(
      "media",
      {
        file: fs.createReadStream(`${__dirname}/../${img_file}`),
      },
      (err, data, response) => {
        if (err) {
          console.log("ERROR:\n", err);
          if (cb) {
            cb(err);
          }
        } else {
          // console.log(data);
          console.log("tooting the image...");
          M.post(
            "statuses",
            {
              status: text,
              // media_ids: new Array(data.media_id_string)
              media_ids: new Array(data.id),
            },
            (err, data, response) => {
              if (err) {
                console.log("ERROR:\n", err);
                if (cb) {
                  cb(err);
                }
              } else {
                console.log("tooted!");
                if (cb) {
                  cb(null);
                }
              }
            }
          );
        }
      }
    );
  },
  boost: function(toot_id, cb){
    console.log(`retweeting ${toot_id}...`);
    M.post('statuses/retweet/:id', {
      id: toot_id
    }, function(err, data, response) {
        console.log('done!', {err});
        if (cb){
          cb(err);
        }
    });    
  },
  dm: function(user_id, text, cb){
    console.log(`sending DM to ${user_id}...`);
    M.post('direct_messages/new', {
      user_id: user_id,
      text: text
    }, function(err, data, response) {
      if (cb){
        cb(err);
      }
    });      
  },
  getTootIDfromTootURL: function(toot_url){
    return toot_url.split('/')[5];
  },
  getUserIDfromTootURL: function(toot_url){
    return toot_url.split('/')[3];
  },
  isWhitelisted: function(user_id, cb){
    // M.get('friends/ids', { screen_name: process.env.twitter_screen_name, stringify_ids: true },  function (err, data, response) {
    //   if (data.ids && data.ids.indexOf(user_id) > -1){
    //     if (cb){
    //       cb(null)
    //     }
    //   }
    //   else{
    //     cb({
    //       err: 'not_whitelisted',
    //       error_message: 'User not whitelisted.'
    //     });
    //   }
    // });
  },
  promptSubmit: function(tootUsername, tootID, cb){
    var intro_text = 'Hi' + (tootUsername ? ` @${tootUsername}`  : '' );

    M.post('statuses/update',{
      in_reply_to_status_id: tootID,
      auto_populate_reply_metadata: true,
      // status: `${intro_text}, would you be interested in adding your bot to Botwiki? botwiki.org/submit-your-bot`
      status: `Hi, would you be interested in adding your bot to Botwiki? botwiki.org/submit-your-bot`
    }, function(err, data, response) {
      if (cb){
        cb(err);
      }
    });
  }  
};
