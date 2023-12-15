/*********************************************************************************
Move messages marked with :arrow_forward: to a specified channel.

/sidekick move #channel

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js");

const explainMessageMove = (bot, messageOriginal) => {
  let attachments = [],
    attachment = {
      title: "Moving messages between channels",
      color: "#333",
      fields: [],
      mrkdwn_in: ["fields"],
    };

  attachment.fields.push({
    value:
      "1. First, mark the messages you want to move with :arrow_forward:.\n2. Wait a few seconds for Slack to index the messages.\n3. Finally, use the `/sidekick move #channel` command to move the marked messages to a new channel.",
  });

  attachments.push(attachment);

  bot.api.chat.postEphemeral({
    channel: messageOriginal.channel,
    user: messageOriginal.user,
    attachments: JSON.stringify(attachments),
  });
};

module.exports = (controller) => {
  controller.on("slash_command", (bot, message) => {
    let messageOriginal = message;
    let { command, args } = helpers.parse_slash_command(message);

    if (command === "move") {
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, (err) => {
        if (err) {
          bot.replyPrivate(message, err.error_message);
        } else {
          let channel = helpers.parse_channel_ids(args[0])[0];

          bot.api.search.all(
            {
              token: bot.config.bot.app_token,
              query: "has::arrow_forward:",
              page: 1,
              sort: "timestamp",
            },
            (error, response) => {
              let matched_messages = response.messages.matches,
                matched_files = response.files.matches;

              if (matched_messages.length === 0 && matched_files.length === 0) {
                bot.replyPrivate(messageOriginal, "Nothing found.");
              }

              let moveMessagesFn = function moveMessages(match, index) {
                return new Promise((resolve) => {
                  return setTimeout(() => {
                    bot.api.chat.postMessage(
                      {
                        channel: channel,
                        parse: "link_names ",
                        mrkdwn: true,
                        text: `Originally posted in <#${match.channel.id}> by <@${match.user}>:\n>>> ${match.text}`,
                        unfurl_links: true,
                      },
                      (err, message) => {
                        if (err) {
                          console.log("error:\n", err);
                        } else {
                          let message_ts = match.ts;
                          bot.api.chat.delete(
                            {
                              token: process.env.superToken,
                              channel: match.channel.id,
                              ts: message_ts,
                            },
                            (err, message) => {
                              if (err) {
                                console.log("error:\n", err);
                              }
                            }
                          );
                        }
                      }
                    );
                  }, index * 1000);
                });
              };

              let moveFilesFn = function moveFiles(match, index) {
                return new Promise((resolve) => {
                  return setTimeout(() => {
                    let message_ts = match.timestamp;
                    let file_id = match.id;

                    let channel_id_original = match.channels[0];
                    let filename_local = `${match.timestamp}-${match.name}`;
                    let user_original = match.user;
                    let original_comment = match.initial_comment
                      ? `>>>${match.initial_comment.comment}`
                      : "";
                    let filepath = path.join("./attachments", filename_local);

                    bot.api.files.sharedPublicURL(
                      { token: process.env.superToken, file: match.id },
                      (err, data) => {
                        if (err) {
                          console.log("err:/n", err);
                        }

                        helpers.download_file(
                          {
                            encoding: null,
                            url: match.url_private,
                            headers: {
                              Authorization: `Bearer ${process.env.superToken}`,
                            },
                          },
                          filepath,
                          (err, data) => {
                            fs.readFile(filepath, (err, data) => {
                              bot.api.files.upload(
                                {
                                  channels: channel,
                                  // content: data,
                                  file: fs.createReadStream(filepath),
                                  filename: match.name ? match.name : "",
                                  initial_comment:
                                    `Originally posted in <#${channel_id_original}>` +
                                    (user_original
                                      ? `by <@${user_original}>. ${original_comment}`
                                      : ``),
                                },
                                (err, message) => {
                                  if (err) {
                                    console.log("error:\n", err);
                                  } else {
                                    bot.api.files.delete(
                                      {
                                        token: process.env.superToken,
                                        channel: channel,
                                        file: file_id,
                                        unfurl_links: true,
                                      },
                                      (err, message) => {
                                        if (err) {
                                          console.log("error:\n", err);
                                        }
                                      }
                                    );
                                  }
                                }
                              );
                            });
                          }
                        );
                      }
                    );
                  }, index * 1000);
                });
              };

              let actions = matched_messages
                  .map(moveMessagesFn)
                  .concat(matched_files.map(moveFilesFn)),
                results = Promise.all(actions);

              results.then((data, index) => {
                bot.replyPrivate(messageOriginal, "All done!");
              });
            }
          );
        }
      });
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    let messageOriginal = message;
    if (message.type == "interactive_message_callback") {
      console.log("message_actions\n", message.actions);

      if (message.actions[0].name === "actions") {
        if (message.actions[0].value === "moderator_commands") {
          helpers.is_admin(bot, message, (err) => {
            if (!err) {
              explainMessageMove(bot, messageOriginal);
            }
          });
        }
      }
    }
    next();
  });

  controller.on("message_action", (bot, message, cb) => {
    let callbackId = message.callback_id;

    if (callbackId === "move_message") {
      console.log("logging message...", message);
      let original_message = message.message,
        messageData = JSON.stringify({
          user_id: original_message.user || original_message.user_id,
          message_url: `https://${process.env.group_name}.slack.com/archives/${
            message.channel
          }/p${message.message_ts.replace(".", "")}`,
          message_text: message.message.text,
          files: message.message.files,
          original_channel: message.channel,
          message_ts: message.message.ts,
        });

      console.log(messageData);

      helpers.is_admin(bot, message, (err) => {
        if (err) {
          bot.api.chat.postEphemeral({
            channel: messageData.original_channel,
            user: messageData.user_id,
            text: `<@${messageData.user_id}> Sorry, only admins can do that.`,
          });
        } else {
          console.log(message.message.files);
          console.log({ original_message: message });

          bot.api.dialog.open(
            {
              trigger_id: message.trigger_id,
              dialog: JSON.stringify({
                callback_id: "move_message_to_channel",
                title: "Move message",
                submit_label: "Move",
                elements: [
                  {
                    label: "Choose channel.",
                    type: "select",
                    name: "forward_channel_select",
                    data_source: "channels",
                  },
                  {
                    label: "Message data",
                    name: "messageData",
                    type: "textarea",
                    value: messageData,
                  },
                ],
              }),
            },
            (err, data) => {
              console.log({ err, data });
              if (err) {
                console.log(data.response_metadata);
              }
            }
          );
        }
      });
    }
  });

  controller.on("dialog_submission", (bot, event) => {
    bot.replyAcknowledge();
    let submission = event.submission;
    if (event.callback_id === "move_message_to_channel") {
      // console.log({event}, {submission});

      let messageData = JSON.parse(submission.messageData);
      console.log(messageData);

      bot.api.chat.postMessage(
        {
          channel: submission.forward_channel_select,
          parse: "link_names ",
          mrkdwn: true,
          text:
            `Originally posted in <#${messageData.original_channel}>` +
            (messageData && messageData.user_id
              ? `by <@${messageData.user_id}>`
              : ``) +
            `:\n>>> ${messageData.message_text}`,
          // files: messageData.files,
          unfurl_links: true,
        },
        (err, message) => {
          if (err) {
            console.log("error:\n", err);
          } else {
            bot.api.chat.delete(
              {
                token: process.env.superToken,
                channel: messageData.original_channel,
                ts: messageData.message_ts,
              },
              (err, message) => {
                if (err) {
                  console.log("error:\n", err);
                }
              }
            );
          }
        }
      );
    }
  });
};
