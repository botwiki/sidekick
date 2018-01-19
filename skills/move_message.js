/*********************************************************************************
Move messages marked with :arrow_forward: to a specified channel.

/sidekick move #channel

*********************************************************************************/


var request = require('request');

var fs = require('fs'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js');

function explain_message_move(bot, message_original){
  var attachments = [], attachment = {
    title: 'Moving messages between channels',
    color: '#333',
    fields: [],
    mrkdwn_in: ['fields']
  };


  attachment.fields.push(
    {
      value: '1. First, mark the messages you want to move with :arrow_forward:.\n2. Wait a few seconds for Slack to index the messages.\n3. Finally, use the `/sidekick move #channel` command to move the marked messages to a new channel.'
    }
  );  
  
  attachments.push(attachment);

  bot.api.chat.postEphemeral({
    channel: message_original.channel,
    user: message_original.user,
    attachments: JSON.stringify(attachments)
  });
}


module.exports = function(controller) {
  controller.on('slash_command', function(bot, message) {
    var message_original = message;
    
    var {command, args} = helpers.parse_slash_command(message);

    if (command === 'move'){
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, function(err){
        if (err){
          bot.replyPrivate(message, err.error_message);    
        }
        else{
          var channel = helpers.parse_channel_ids(args[0])[0];

          bot.api.search.all({
            token: bot.config.bot.app_token,
            query: 'has::arrow_forward:',
            page: 1,
            sort: 'timestamp'},
          (error, response) => {
            
            var matched_messages = response.messages.matches,
                matched_files = response.files.matches;
            
            if (matched_messages.length === 0 && matched_files.length === 0){
              bot.replyPrivate(message_original, 'Nothing found.');
            }
            
            var moveMessagesFn = function moveMessages(match, index){
              return new Promise(function(resolve){
                return setTimeout(function(){
                  bot.api.chat.postMessage({
                    channel: channel,
                    parse: 'link_names ',
                    mrkdwn: true,
                    text: `Originally posted in <#${match.channel.id}> by <@${match.user}>:\n>>> ${match.text}`,
                    unfurl_links: true
                  }, function(err, message){
                    if (err){
                      console.log('error:\n', err);
                    }else{
                      var message_ts = match.ts;
                      bot.api.chat.delete({
                        token: process.env.superToken,
                        channel: match.channel.id,
                        ts: message_ts
                      }, function(err, message){
                        if (err){
                          console.log('error:\n', err);
                        }
                      });                      
                    }
                  });
                }, index * 1000);          
              });
            }

            var moveFilesFn = function moveFiles(match, index){
              return new Promise(function(resolve){
                return setTimeout(function(){
                  var message_ts = match.timestamp;
                  var file_id = match.id;
                                    
                  var channel_id_original = match.channels[0];
                  var filename_local = `${match.timestamp}-${match.name}`;
                  var user_original = match.user;
                  var original_comment = (match.initial_comment?`>>>${match.initial_comment.comment}`:'');
                  var filepath = path.join('./attachments', filename_local);
                                   
                  bot.api.files.sharedPublicURL({token: process.env.superToken, file: match.id}, function(err, data){
                    if (err){
                      console.log('err:/n', err);
                    }

                    helpers.download_file({
                      encoding: null,
                      url: match.url_private,
                      headers: { 'Authorization': `Bearer ${process.env.superToken}` }
                    }, filepath, function(err, data){

                      fs.readFile(filepath, function (err, data) {                    

                          bot.api.files.upload({
                            channels: channel,
                            // content: data,
                            file: fs.createReadStream(filepath),
                            filename: (match.name?match.name:''),
                            initial_comment:  `Originally posted in <#${channel_id_original}> by <@${user_original}>. ${original_comment}`
                          }, function(err, message){
                            if (err){
                              console.log('error:\n', err);
                            }else{
                              bot.api.files.delete({
                                token: process.env.superToken,
                                channel: channel,
                                file: file_id,
                                unfurl_links: true
                              }, function(err, message){
                                if (err){
                                  console.log('error:\n', err);
                                }
                              });                   
                            }
                          });   
                      });          
                    })     
                  });
                }, index * 1000);          
              });
            }            
            
            var actions = matched_messages.map(moveMessagesFn).concat(matched_files.map(moveFilesFn)),
                results = Promise.all(actions);  

            results.then(function (data, index) {
              bot.replyPrivate(message_original, 'All done!');
            });             
          });   
        }
      });          
    }
  });

  controller.middleware.receive.use(function(bot, message, next) {

    var message_original = message;
    if (message.type == 'interactive_message_callback') {
      console.log('message_actions\n', message.actions);

      if (message.actions[0].name === 'actions') {
        if (message.actions[0].value === 'moderator_commands') {
          helpers.is_admin(bot, message, function(err){
            if (!err){
              explain_message_move(bot, message_original);
            }
          });
        }
      }
    }
    next();
  });  
}


