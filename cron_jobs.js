var fs = require('fs'),
    fsPath = require('fs-path'),
    util = require('util'),
    generators = {
     overlay: require(__dirname + '/generators/overlay.js'), 
    },
    twitter = require(__dirname + '/twitter.js'),
    helpers = require(__dirname + '/helpers.js'),
    moment = require('moment'),  
    channel_ids = require(__dirname + '/channel_ids.js');

var mastodon = require('./fediverse/mastodon.js');

module.exports = function(controller){
    return [
    // {
    //   description: 'notify inactive members, deactivate inactive accounts',
    //   interval: '* * * * *',
    //   job: function(){
    //     helpers.cleanup(controller);
    //   }
    // },
    {
      description: 'check botsin.space for new bots',
      interval: '*/5 * * * *',
      job: function(){
        console.log('checking for new bots on botsin.space...');
        controller.storage.teams.all(function(err, all_team_data) {
          var bot = controller.spawn({token: all_team_data[0].token});


          fs.readFile(__dirname + '/.data/botsinspace-bots.txt', 'utf8', function (err, data) {
            if (err){
              var botsinspace_bots = [];
            }
            else{
              var botsinspace_bots = JSON.parse(data);
            }

            var new_bots_maybe = [];
            
            mastodon.M.get('timelines/public', {
              local: true,
              limit: 40
            }).then(function(res){
              var statuses = res.data;
              statuses.forEach(function(status){
                // console.log(status);
                if (botsinspace_bots.indexOf(status.account.url) === -1){
                  // new bot?
                  console.log('new bot?', status.account.url);
                  botsinspace_bots.push(status.account.url);
                  new_bots_maybe.push(status.account.url);
                }
              });
              // console.log(botsinspace_bots);

              bot.api.chat.postMessage({
                  channel: channel_ids.twitter_feed,
                  text: `New bots?\n-${new_bots_maybe.join('\n-')}`         
              });              

              fs.writeFileSync(__dirname + '/.data/botsinspace-bots.txt', JSON.stringify(botsinspace_bots));
            });
          });

        });        
      }
    },
    {
      description: 'update last active statuses based on login information',
      interval: '*/10 * * * *',
      job: function(){
        controller.storage.teams.all(function(err, all_team_data) {
          var bot = controller.spawn({token: all_team_data[0].token});
          bot.api.team.accessLogs({ token: process.env.superToken }, function(err, data){
            // console.log({data});
            data.logins.forEach(function(member){
              if (member.date_last){
                var active_time =   moment.unix(member.date_last).format();  
                helpers.update_last_active_time(controller, bot, member.user_id, active_time);
              }
            });            
          });
        });        
      }
    },
    {
      description: 'post group info into #logs once every hour',
      interval: '0 * * * *',
      job: function(){
        controller.storage.teams.all(function(err, all_team_data) {
          var bot = controller.spawn({token: all_team_data[0].token});
          helpers.get_group_info(bot, null, function(err, data){
            helpers.log_event(bot, '', data);
          });
        });        
      }
    },
    {
      description: 'update profile picture on Twitter',
      interval: '*/30 * * * *',
      job: function(){
        twitter.get_tweet_image(function(tweet_media){
          var w = 500, h = 500,
              tweet_media_w = tweet_media.sizes.large.w,
              tweet_media_h = tweet_media.sizes.large.h,
              aspect_ratio = 1;

          if (tweet_media_w < w){
            tweet_media_w = w;
            aspect_ratio = w / tweet_media_w;
            tweet_media_h = h * aspect_ratio;
          }

          if (tweet_media_h < h){
            tweet_media_h = h;
            aspect_ratio = h / tweet_media_h;
            tweet_media_w = w * aspect_ratio;
          }
          
          generators.overlay.overlay_images([
            {
              url: tweet_media.media_url_https,
              x: 0,
              y: 0,
              width: tweet_media_w,
              height: tweet_media_h
            },
            {
              url: 'https://cdn.glitch.com/a8e332a3-3d82-4c9d-86c8-4209720f2ca9%2Fb-inverted.png',
              x: 0,
              y: 0,
              width: w,
              height: h
            }
          ], w, h, function(err, img_data){
            twitter.update_profile_image(img_data, function(err){
              if (!err){
                console.log('updated!');
              }
            });
          });
        });
      }
    },      
    {
      description: 'dump DB every hour',
      interval: '0 * * * *',
      job: function(){
        var d = new Date(),
            db_dump_filename = `db_dump_${helpers.padNumber(d.getFullYear(), 2)}-` +
                               `${helpers.padNumber(d.getMonth(), 2)}-`           +
                               `${helpers.padNumber(d.getDate(), 2)}_`            +
                               `${helpers.padNumber(d.getHours(), 2)}-`           +
                               `${helpers.padNumber(d.getMinutes(), 2)}.db`;

        controller.storage.teams.all(function(err, all_team_data) {
          fsPath.writeFile(`.data/db_dump/${db_dump_filename}`, JSON.stringify(all_team_data), function(err){
            console.log(`dumping DB...`);          
            if(err) {
                return console.log(err);
            }else{
              console.log(`DB saved to ${db_dump_filename}`);

              fs.readdir('.data/db_dump', function(err, files) {
                // console.log(files.length, {files})
                var max_files_count = 80;
                if (files.length > max_files_count){
                  var old_files = files.slice(0, files.length - max_files_count)
                  // console.log({old_files})
                  old_files.forEach(function(file){
                    fs.unlink(`.data/db_dump/${file}`);
                  });
                }                
              });   
            }
          });
        });        
      } 
    }
  ]; 
} 
