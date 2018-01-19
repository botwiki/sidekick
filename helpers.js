/* TODO: This could be broken up into helpers.js and helpers-slack.js, etc. */

var fs = require('fs'),
    qs = require('qs'),
    path = require('path'),
    request = require('request'),
    moment = require('moment'),    
    channel_ids = require(__dirname + '/channel_ids.js');

module.exports = {
  parse_channel_ids: function(str) {
    var patt = new RegExp(/(?:<#).*?(?:>)/gi),
        channel_ids_parsed = [], match;

    while ((match = patt.exec(str)) != null) {
      channel_ids_parsed.push(match[0].replace(/<#|>/g,'').split('|')[0]);
    }

    return channel_ids_parsed;
  },
  parse_slash_command: function(message){
    var message_text_arr = message.text.split(' ');
    return {
      command: message_text_arr[0],
      args: message_text_arr.slice(1)
    };    
  },
  random_from_array: function(arr) {
    return arr[Math.floor(Math.random()*arr.length)]; 
  },
  get_random_int: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  get_random_range: function(min, max, fixed) {
    return (Math.random() * (max - min) + min).toFixed(fixed) * 1;
  },
  number_with_commas: function(num){
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  padNumber: function(number, length) {
    var str = '' + number;
    while (str.length < length) {
      str = '0' + str;
    }   
    return str;
  },
  get_path_from_url: function(url) {
    return url.split(/[?#]/)[0];
  },
  get_random_hex: function() {
    return '#' + Math.random().toString(16).slice(2, 8).toUpperCase();
  },
  shade_color: function(color, percent) {
    // https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    var f = parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return `#${(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1)}`;
  },
  download_file: function(options, filename, cb){
    request(options).pipe(fs.createWriteStream(filename)).on('close', cb);
    // request.head(options, function(err, res, body){
    //   var r = request(options).pipe(fs.createWriteStream(filename)).on('close', cb);
    // });
  },
  check_domain_blacklist: function(url){
  return [
    // TODO: Temporary solution, move to a separate file
      'twitch.tv',
      'howwegettonext.com',
      'dragplus.com',
      'adf.ly',
      'linkis.com'
    ].indexOf(url) > -1;
  },
  is_admin: function(bot, message, cb) {
    var helpers = this;
    bot.api.users.info({user: message.user}, function(err, res){
      if (err){
        console.log({err});
        if (err === 'not_admin'){
          cb({error: 'not_admin', error_message: 'Only admins can do that, sorry!'});
        }else{
          helpers.notify(bot, message, 'Error!', err);
        }
        console.log('err\n', err);
      }
      else if(res.user.is_admin){
        cb(null);
      }
      else{
        cb({error: 'not_admin', error_message: 'Only admins can do that, sorry!'});
      }
    });
  },
  log_event: function(bot, log_text, attachments){
    bot.api.chat.postMessage({
      channel: channel_ids.logs,
      text: log_text,
      attachments: JSON.stringify(attachments)
    },function(err,res) {
      if (err) {
        console.log(err);
      }
    });   
  },
  update_last_active_time: function(controller, bot, user_id, active_time, cb){
    controller.storage.users.get(user_id, function(err, data) {
      console.log(`loading user data for ${user_id}...`, {err}, {data});

      if (err || !data){
        var data = {
          id: user_id
        };
      }

      if (active_time === 'now'){
        data.last_active = moment().format();
      }
      else{
        data.last_active = active_time;      
      }
      console.log(`loaded data for user ${user_id}...`, {data});

      controller.storage.users.save(data, function(err, data) {
        console.log(`saved user ${user_id}`, {err}, {data});

//         controller.storage.users.get(user_id, function(err, data) {
//           console.log(`loading user data for ${user_id} again...`, {err}, {data});
//         });      

        if (cb){
          cb();
        }
      });
    });  
  },
  notify_mods: function(bot, message_from, message_body, cb){
    
    var attachments = [], attachment = {
      color: '#4A89DC',
      fields: [],
      mrkdwn_in: ['fields']
    };

    attachment.fields.push({
      value: message_body
    });    
    attachments.push(attachment);
    
    
    var msg_text = '';
    if (message_from){
      msg_text = `A message from <@${message_from}>:`;
    }
    
    bot.api.chat.postMessage({
      channel: channel_ids.moderators,
      text: msg_text,
      attachments: JSON.stringify(attachments)
    },function(err,res) {
      if (err) {
        console.log(err);
        cb(err);
      }
      else{
        cb(null);
      }
    });  
  },
  get_group_info: function(bot, message, cb){
    var helpers = this;
    /* Get basic info about the group. */
    var original_message = message;
    bot.api.users.list({
      presence: true
    }, function(message, data){
      var all_users = data.members,
          bots = [],
          online_users = [],
          disabled_users = [];

      all_users.forEach(function(user){
        if (!user.deleted && (user.is_bot || user.name === 'slackbot')){
          // console.log(user)
          bots.push(user);
        }
      });

      all_users = data.members.filter(function(member){
        return (!member.is_bot && member.name !== 'slackbot');
      });

      all_users.forEach(function(user){
        if (user.deleted === true){
          disabled_users.push(user);
        }
        else if (user.presence === 'active'){
          online_users.push(user);
        }
      });

      var attachments = [], attachment = {
        // title: 'Botmakers group info',
        color: '#36a64f',
        fields: []
        // footer: `Also, there are ${bots.length} bots and other integrations, including *@slackbot*.`
      };

      attachment.fields.push({
        title: 'Registered members',
        value: `:bar_chart: ${helpers.number_with_commas(all_users.length)}`,
        short: true
      });

      attachment.fields.push({
        title: 'Active',
        value: `:green_heart: ${helpers.number_with_commas(all_users.length - disabled_users.length)}`,
        short: true
      });

      attachment.fields.push({
        title: 'Deactivated',
        value: `:no_entry: ${helpers.number_with_commas(disabled_users.length)}`,
        short: true
      });

      attachment.fields.push({
        title: 'Online right now',
        value: `:eyes: ${helpers.number_with_commas(online_users.length)}`,
        short: true
      });

      attachment.fields.push({
        title: 'Bots and integrations',
        value: `:robot_face: ${helpers.number_with_commas(bots.length)}`,
        short: true
      });
      attachments.push(attachment);
      cb(null, attachments);
    });   
  },
  get_bot_info: function(bot, message, cb){
    var helpers = this;
    /* Get basic info about the group. */
    var original_message = message;
    bot.api.users.list({
      presence: true
    }, function(message, data){
      var all_users = data.members,
          bots = [];

      var attachments = [], attachment = {
        // title: 'Botmakers group info',
        color: '#36a64f',
        fields: [],
        mrkdwn_in: ['text,fields']
        // footer: `Also, there are ${bots.length} bots and other integrations, including *@slackbot*.`
      };

       all_users.forEach(function(user){
        if (!user.deleted && (user.is_bot || user.name === 'slackbot')){
          // console.log(user);
          bots.push(user);

          attachment.fields.push({
            // title: `:robot_face: @${user.name}`,
            value: `:robot_face: <@${user.name}>`,
            thumb_url: user.profile.image_192,
            short: true
          });
        }
      });

      attachment.pretext = `There are ${helpers.number_with_commas(bots.length)} bots in this group. <https://github.com/botwiki/botmakers.org/blob/master/BOTS.md|Learn more.>`
      
      attachments.push(attachment);
      cb(null, attachments);
    });   
  },
  notify: function(bot, message, title, text){
    var attachments = [], attachment = {
      title: title,
      color: '#ffa700',
      fields: [],
      mrkdwn_in: ['fields']
    };

    attachment.fields.push({
      value: text
    });    

    attachments.push(attachment);

    bot.api.chat.postEphemeral({
      channel:message.channel,
      user: message.user,
      attachments: JSON.stringify(attachments)
    });       
  },
  deactivate: function(bot, message, user_id, cb){
    var helpers = this;
    console.log(`Deleting user <@${user_id}>...`);

    var options = {
      token: process.env.superToken,
      user: user_id
    }

    var url = `https://slack.com/api/users.admin.setInactive?${qs.stringify(options)}`; 

    var r = request.get(url, function(err, resp, body){
      console.log('users.admin.setInactive', body);
      if (err){
        console.log('users.admin.setInactive ERROR', err);
      }
      else{
        console.log(`User <@${user_id}> was removed.`);
        // helpers.notify_mods(bot, null, `User <@${user_id}> was removed.`, function(err, data){});
        if (cb){
          cb();
        }
      }
    });        
  }
};
