/*********************************************************************************

Add Mastodon functionality

*********************************************************************************/

const request = require("request"),
  helpers = require(__dirname + "/../helpers.js"),
  mastodon = require(__dirname + "/../networks/mastodon.js"),
  channel_ids = require(__dirname + "/../channel_ids.js");

module.exports = (controller) => {
  controller.on("slash_command", (bot, message) => {
    let messageOriginal = message,
      { command, args } = helpers.parse_slash_command(message);

    if (command === "track") {
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, (err) => {
        if (err) {
          bot.replyPrivate(message, err.error_message);
        } else {
          let tracked_data = [];

          controller.storage.teams.get(message.team_id, (err, data) => {
            if (err) {
              console.log("error\n", err);
              helpers.notify(bot, message, "Error!", err);
            }
            tracked_data = data.tracked;

            if (args[0] === "list") {
              let attachments = [],
                attachment = {
                  title: "Tracked keywords",
                  color: "#333",
                  fields: [],
                };

              if (!tracked_data) {
                bot.api.chat.postEphemeral({
                  channel: message.channel,
                  user: message.user,
                  text: "No tracked keywords found.",
                  attachments: JSON.stringify(attachments),
                });
                return false;
              }

              tracked_data.forEach((data) => {
                attachment.fields.push({
                  value: data,
                  short: true,
                });
              });

              attachments.push(attachment);

              bot.api.chat.postEphemeral({
                channel: message.channel,
                user: message.user,
                attachments: JSON.stringify(attachments),
              });
            } else if (args[0] === "remove") {
              // let keywords = args.slice(1).join(' ').match(/\w+|"[^"]+"/g);
              let keywords = args
                .slice(1)
                .join(" ")
                .match(/[^\s"]+|"([^"]*)"/g);
              keywords = keywords.map((keyword) => {
                return keyword.replace(/"/gi, "");
              });
              tracked_data = tracked_data.filter((keyword) => {
                return keywords.indexOf(keyword) === -1;
              });

              data.tracked = tracked_data;
              controller.storage.teams.save(data, (err, data) => {
                if (err) {
                  console.log("error\n", err);
                } else {
                  bot.api.chat.postEphemeral({
                    channel: message.channel,
                    text: `<@${message.user}> updated tracked keywords.`,
                    attachments: JSON.stringify(attachments),
                  });

                  let attachments = [],
                    attachment = {
                      color: "#333",
                      fields: [],
                    };

                  tracked_data.forEach((data) => {
                    attachment.fields.push({
                      value: data,
                      short: true,
                    });
                  });

                  attachments.push(attachment);

                  bot.api.chat.postEphemeral({
                    channel: message.channel,
                    user: message.user,
                    text: "Updated tracked keywords.",
                    attachments: JSON.stringify(attachments),
                  });
                }
              });
            } else {
              // let keywords = args.join(' ').match(/\w+|"[^"]+"/g);
              let keywords = args.join(" ").match(/[^\s"]+|"([^"]*)"/g);
              if (!keywords || !keywords.length) {
                let attachments = [],
                  attachment = {
                    title: "Tracking keywords",
                    color: "#333",
                    fields: [],
                    mrkdwn_in: ["fields"],
                  };

                attachment.fields.push(
                  {
                    value: "`/sidekick track list`",
                  },
                  {
                    value:
                      '`/sidekick track KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`',
                  },
                  {
                    value:
                      '`/sidekick track remove KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`',
                  }
                );

                attachments.push(attachment);

                bot.api.chat.postEphemeral({
                  channel: message.channel,
                  user: message.user,
                  text: "Here's how you can use the `/sidekick track` command.",
                  attachments: JSON.stringify(attachments),
                });
              } else {
                keywords = keywords.map((keyword) => {
                  return keyword.replace(/"/gi, "");
                });

                if (!tracked_data || tracked_data.length === 0) {
                  tracked_data = keywords;
                } else {
                  keywords.forEach((keyword) => {
                    if (tracked_data.indexOf(keyword) === -1) {
                      tracked_data.push(keyword);
                    }
                  });
                }

                data.tracked = tracked_data;
                controller.storage.teams.save(data, (err, data) => {
                  if (err) {
                    console.log("error\n", err);
                  } else {
                    bot.api.chat.postEphemeral({
                      channel: message.channel,
                      text: `<@${message.user}> updated tracked keywords.`,
                      attachments: JSON.stringify(attachments),
                    });

                    let attachments = [],
                      attachment = {
                        color: "#333",
                        fields: [],
                      };

                    tracked_data.forEach((data) => {
                      attachment.fields.push({
                        value: data,
                        short: true,
                      });
                    });

                    attachments.push(attachment);

                    bot.api.chat.postEphemeral({
                      channel: message.channel,
                      user: message.user,
                      text: "Updated tracked keywords.",
                      attachments: JSON.stringify(attachments),
                    });
                  }
                });
              }
            }
          });
        }
      });
    } else if (command === "ignore") {
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, (err) => {
        if (err) {
          bot.replyPrivate(message, err.error_message);
        } else {
          let ignored_data = [];

          controller.storage.teams.get(message.team_id, (err, data) => {
            if (err) {
              console.log("error\n", err);
              helpers.notify(bot, message, "Error!", err);
            }
            ignored_data = data.ignored;

            if (args[0] === "list") {
              let attachments = [],
                attachment = {
                  title: "Ignored keywords",
                  color: "#333",
                  fields: [],
                };

              if (!ignored_data || ignored_data.length === 0) {
                bot.api.chat.postEphemeral({
                  channel: message.channel,
                  user: message.user,
                  text: "No ignored keywords found.",
                  attachments: JSON.stringify(attachments),
                });
                return false;
              }

              ignored_data.forEach((data) => {
                attachment.fields.push({
                  value: data,
                  short: true,
                });
              });

              attachments.push(attachment);

              bot.api.chat.postEphemeral({
                channel: message.channel,
                user: message.user,
                attachments: JSON.stringify(attachments),
              });
            } else if (args[0] === "remove") {
              // let keywords = args.slice(1).join(' ').match(/\w+|"[^"]+"/g);
              let keywords = args
                .slice(1)
                .join(" ")
                .match(/[^\s"]+|"([^"]*)"/g);
              keywords = keywords.map((keyword) => {
                return keyword.replace(/"/gi, "");
              });
              ignored_data = ignored_data.filter((keyword) => {
                return keywords.indexOf(keyword) === -1;
              });

              data.ignored = ignored_data;
              controller.storage.teams.save(data, (err, data) => {
                if (err) {
                  console.log("error\n", err);
                } else {
                  bot.api.chat.postMessage({
                    channel: message.channel,
                    text: `<@${message.user}> updated ignored keywords.`,
                  });

                  let attachments = [],
                    attachment = {
                      color: "#333",
                      fields: [],
                    };

                  ignored_data.forEach((data) => {
                    attachment.fields.push({
                      value: data,
                      short: true,
                    });
                  });

                  attachments.push(attachment);

                  // bot.api.chat.postEphemeral({
                  //   channel: message.channel,
                  //   user: message.user,
                  //   text: 'Updated ignored keywords.',
                  //   attachments: JSON.stringify(attachments)
                  // });
                }
              });
            } else {
              // let keywords = args.join(' ').match(/\w+|"[^"]+"/g);
              let keywords = args.join(" ").match(/[^\s"]+|"([^"]*)"/g);
              if (!keywords || !keywords.length) {
                let attachments = [],
                  attachment = {
                    title: "Ignoring keywords",
                    color: "#333",
                    fields: [],
                    mrkdwn_in: ["fields"],
                  };

                attachment.fields.push(
                  {
                    value: "`/sidekick ignore list`",
                  },
                  {
                    value:
                      '`/sidekick ignore KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`',
                  },
                  {
                    value:
                      '`/sidekick ignore remove KEYWORD KEYWORD "KEYWORD W/MULTIPLE WORDS" [...]`',
                  }
                );

                attachments.push(attachment);

                bot.api.chat.postEphemeral({
                  channel: message.channel,
                  user: message.user,
                  text: "Here's how you can use the `/sidekick ignore` command.",
                  attachments: JSON.stringify(attachments),
                });
              } else {
                keywords = keywords.map((keyword) => {
                  return keyword.replace(/"/gi, "");
                });

                if (!ignored_data || ignored_data.length === 0) {
                  ignored_data = keywords;
                } else {
                  keywords.forEach((keyword) => {
                    if (ignored_data.indexOf(keyword) === -1) {
                      ignored_data.push(keyword);
                    }
                  });
                }

                // controller.storage.teams.save({id: message.team_id, ignored: ignored_data}, (err, data)  => {
                data.ignored = ignored_data;
                controller.storage.teams.save(data, (err, data) => {
                  if (err) {
                    console.log("error\n", err);
                  } else {
                    bot.api.chat.postMessage({
                      channel: message.channel,
                      text: `<@${message.user}> updated ignored keywords.`,
                    });

                    let attachments = [],
                      attachment = {
                        color: "#333",
                        fields: [],
                      };

                    ignored_data.forEach((data) => {
                      attachment.fields.push({
                        value: data,
                        short: true,
                      });
                    });

                    attachments.push(attachment);

                    // bot.api.chat.postEphemeral({
                    //   channel: message.channel,
                    //   user: message.user,
                    //   text: 'Updated ignored keywords.',
                    //   attachments: JSON.stringify(attachments)
                    // });
                  }
                });
              }
            }
          });
        }
      });
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    let messageOriginal = message;
    if (message.type == "interactive_message_callback") {
      // console.log('message_actions\n', message);
      let originalMessage = message;

      const boost = (bot, originalMessage, message, submitPrompt) => {
        helpers.is_admin(bot, message, (err) => {
          if (err) {
            bot.api.chat.postEphemeral({
              channel: originalMessage.channel,
              user: originalMessage.user,
              text: err.error_message,
            });
          } else {
            // console.log('boost', originalMessage.actions[0].value);
            mastodon.boost(originalMessage.actions[0].value, (err) => {
              if (err) {
                console.log("Unable to boost.", { err });
                if (err.message) {
                  let attachments = [],
                    attachment = {
                      color: "#ED5565",
                      fields: [],
                    };

                  attachment.fields.push({
                    value: err.message,
                  });

                  attachments.push(attachment);

                  bot.api.chat.postEphemeral({
                    channel: originalMessage.channel,
                    user: originalMessage.user,
                    text: "Unable to boost.",
                    attachments: JSON.stringify(attachments),
                  });
                }
              } else {
                // bot.api.chat.postEphemeral({
                //   channel: originalMessage.channel,
                //   user: originalMessage.user,
                //   text: 'Boosted :thumbsup:'
                // });
                if (submitPrompt === true) {
                  mastodon.prompt_submit(
                    null,
                    originalMessage.actions[0].value
                  );
                }
                bot.api.chat.postMessage({
                  channel: originalMessage.channel,
                  text: `<@${originalMessage.user}> boosted :thumbsup:`,
                });
              }
            });
          }
        });
      };

      if (originalMessage.actions[0].name === "boost") {
        // boost(bot, originalMessage, message, false);
      } else if (originalMessage.actions[0].name === "boost_and_prompt") {
        // boost(bot, originalMessage, message, true);
      } else if (originalMessage.actions[0].name === "submit_to_botwiki") {
        helpers.is_admin(bot, originalMessage, (err) => {
          if (err) {
            bot.replyPrivate(message, err.error_message);
          } else {
            console.log(originalMessage.text);
            const submitURL = `https://botwiki.org/wp-json/bw/import-bots?key=${
              process.env.BOTWIKI_INTERNAL_API_KEY
            }&urls=${originalMessage.text
              .split("/statuses/")[0]
              .replace("users/", "@")}`;
            
            request.get(submitURL, (err, res, body) => {
              console.log(err, body);
            });            

            bot.api.chat.postMessage({
              channel: originalMessage.channel,
              text: `<@${originalMessage.user}> submitted :thumbsup:`,
            });
          }
        });
      } else if (message.actions[0].value.indexOf("forward_dialog") > -1) {
        let tweetUrl = message.actions[0].value.split("!")[1];
        bot.api.dialog.open(
          {
            trigger_id: message.trigger_id,
            dialog: JSON.stringify({
              callback_id: "forward_message",
              title: "Forward message",
              submit_label: "Forward",
              elements: [
                {
                  label: "Tweet URL",
                  name: "tweet_url",
                  type: "text",
                  subtype: "url",
                  subtype: "email",
                  value: tweetUrl,
                },
                {
                  label: "Choose channel",
                  type: "select",
                  name: "forward_channel_select",
                  placeholder: "#channel",
                  value: "forward_channel",
                  options: [
                    {
                      label: "#news",
                      value: "news",
                    },
                    {
                      label: "#projects",
                      value: "projects",
                    },
                    {
                      label: "#events",
                      value: "events",
                    },
                    {
                      label: "#ideas",
                      value: "ideas",
                    },
                    {
                      label: "#jobs",
                      value: "jobs",
                    },
                  ],
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
      } else if (originalMessage.actions[0].name === "forward_news") {
        console.log("forward to #", originalMessage.actions[0].value);
        bot.api.chat.postMessage({
          channel: channel_ids.news,
          text: `<@${originalMessage.user}> found this in <#${channel_ids.bot_feed}>: ${originalMessage.actions[0].value}`,
        });
      } else if (originalMessage.actions[0].name === "forward_projects") {
        console.log("forward to #", originalMessage.actions[0].value);
        bot.api.chat.postMessage({
          channel: channel_ids.projects,
          text: `<@${originalMessage.user}> found this in <#${channel_ids.bot_feed}>: ${originalMessage.actions[0].value}`,
        });
      } else if (originalMessage.actions[0].name === "ignore") {
        helpers.is_admin(bot, message, (err) => {
          if (err) {
            bot.api.chat.postEphemeral({
              channel: originalMessage.channel,
              user: originalMessage.user,
              text: err.error_message,
            });
          } else {
            let ignored_username = `@${originalMessage.actions[0].value}`;

            controller.storage.teams.get(
              originalMessage.team.id,
              (err, data) => {
                if (err) {
                  console.log("error\n", err);
                  helpers.notify(bot, message, "Error!", err);
                }

                let ignored_data = data.ignored;

                if (ignored_data.indexOf(ignored_username) === -1) {
                  ignored_data.push(ignored_username);
                }

                data.ignored = ignored_data;
                controller.storage.teams.save(data, (err, data) => {
                  if (err) {
                    console.log("error\n", err);
                  } else {
                    bot.api.chat.postMessage({
                      channel: originalMessage.channel,
                      text: `<@${originalMessage.user}> updated ignored keywords.`,
                    });

                    let attachments = [],
                      attachment = {
                        color: "#333",
                        fields: [],
                      };

                    ignored_data.forEach((data) => {
                      attachment.fields.push({
                        value: data,
                        short: true,
                      });
                    });

                    attachments.push(attachment);

                    // bot.api.chat.postEphemeral({
                    //   channel: originalMessage.channel,
                    //   user: originalMessage.user,
                    //   text: 'Updated ignored keywords.',
                    //   attachments: JSON.stringify(attachments)
                    // });
                  }
                });
              }
            );
          }
        });
      }
    }
    next();
  });
};
