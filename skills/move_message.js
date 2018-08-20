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
  
 
  
  controller.on('message_action', function(bot, message, cb) {
    var callback_id = message.callback_id;
    
    if (callback_id === 'move_message'){
      var original_message = message.message,
          message_data = JSON.stringify({
            user_id: message.user,
            message_url: `https://${process.env.group_name}.slack.com/archives/${message.channel}/p${message.message_ts.replace('.', '')}`,
            message_text: message.message.text,
            files: message.message.files,
            original_channel: message.channel,
            message_ts: message.message.ts
          });

      console.log(message_data);
      
      helpers.is_admin(bot, message, function(err){
        if (err){
          bot.api.chat.postEphemeral({
            channel: message_data.original_channel,
            user: message_data.user_id,
            text: `<@${message_data.user_id}> Sorry, only admins can do that.`
          });              
          
        }
        else{
          console.log(message.message.files);
          console.log({original_message: message});

          bot.api.dialog.open({
            trigger_id: message.trigger_id,
            dialog: JSON.stringify({
              'callback_id': 'move_message_to_channel',
              'title': 'Move message',
              'submit_label': 'Move',
              'elements': [
                {
                  'label': 'Choose channel.',
                  'type': 'select',
                  'name': 'forward_channel_select',
                  'data_source': 'channels'
                },            
                {
                  'label': 'Message data',
                  'name': 'message_data',
                  'type': 'textarea',
                  'value': message_data
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
      });

    }
  });    
  
  controller.on('dialog_submission', function(bot, event) {
    bot.replyAcknowledge();
    var event = event;
    var submission = event.submission;    
    if (event.callback_id === 'move_message_to_channel'){
      // console.log({event}, {submission});      

      var message_data = JSON.parse(submission.message_data);
      console.log(message_data);
      
      bot.api.chat.postMessage({
        channel: submission.forward_channel_select,
        parse: 'link_names ',
        mrkdwn: true,
        text: `Originally posted in <#${message_data.original_channel}> by <@${message_data.user_id}>:\n>>> ${message_data.message_text}`,
        // files: message_data.files,
        unfurl_links: true
      }, function(err, message){
        if (err){
          console.log('error:\n', err);
        }else{
          bot.api.chat.delete({
            token: process.env.superToken,
            channel: message_data.original_channel,
            ts: message_data.message_ts
          }, function(err, message){
            if (err){
              console.log('error:\n', err);
            }
          });                      
        }
      });      

      
    }   
  });    
  
  
  
}


