/*********************************************************************************

Cleanup time! This helps the moderator figure out which accounts are no longer used.

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js"),
  moment = require("moment"),
  wordfilter = require("wordfilter");

const start_cleanup = (bot, message) => {
  bot.api.chat.postEphemeral(
    {
      channel: message.channel,
      user: message.user,
      text: "Time to clean up?",
      attachments: [
        {
          fallback: "Unable to render buttons.",
          callback_id: "sidekick_actions",
          color: "#3AA3E3",
          attachment_type: "default",
          actions: [
            {
              name: "actions",
              text: "Start cleanup",
              style: "danger",
              type: "button",
              value: "start_cleanup",
              confirm: {
                title: "Are you sure?",
                text: "This will send a message to every member of the group.",
                ok_text: "Yep",
                dismiss_text: "Never mind",
              },
            },
            {
              name: "actions",
              text: "See active members",
              type: "button",
              value: "see_active_members",
            },
            {
              name: "actions",
              text: "Remove inactive members",
              style: "danger",
              type: "button",
              value: "remove_inactive_members",
              confirm: {
                title: "Are you sure?",
                text: "Please confirm.",
                ok_text: "Yep",
                dismiss_text: "Never mind",
              },
            },
          ],
        },
      ],
    },
    (err, data) => {
      console.log({ err, data });
    }
  );
};

module.exports = (controller) => {
  controller.on("ambient", (bot, message) => {
    helpers.update_last_active_time(controller, bot, message.user, "now");
  });

  controller.on("team_join", (bot, message) => {
    console.log("team_join", message);
    helpers.update_last_active_time(controller, bot, message.user, "now");
  });

  controller.on("reaction_added", (bot, message) => {
    helpers.update_last_active_time(controller, bot, message.user, "now");
  });

  controller.on("slash_command", (bot, message) => {
    bot.replyAcknowledge();

    let { command, args } = helpers.parse_slash_command(message);

    if (command === "cleanup") {
      start_cleanup(bot, message);
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    let message_original = message;
    if (message.type == "interactive_message_callback") {
      if (message.actions[0].name === "actions") {
        if (message.actions[0].value === "start_cleanup") {
          helpers.is_admin(bot, message, (err) => {
            if (err) {
              bot.api.chat.postEphemeral({
                channel: message_original.channel,
                user: message_original.user,
                text: err.error_message,
              });
            } else {
              bot.api.users.list({}, (err, data) => {
                if (!err && data.members) {
                  bot.api.chat.postEphemeral({
                    channel: message_original.channel,
                    user: message_original.user,
                    text: "_processing..._",
                  });

                  let members = data.members.filter((member) => {
                    return !member.deleted;
                  });

                  console.log(`processing ${members.length} member(s)...`);

                  members.forEach((member, index) => {
                    if (!member.is_bot) {
                      setTimeout(() => {
                        bot.api.im.open(
                          {
                            user: member.id,
                          },
                          (message, data) => {
                            bot.api.chat.postMessage(
                              {
                                channel: data.channel.id,
                                text: "Hi there :wave:\n\nWe are doing a small cleanup of inactive accounts. Please let us know if you're still using this account. (If not, you can ignore this message.)\n\nThank you!",
                                attachments: [
                                  {
                                    fallback: "Unable to render buttons.",
                                    callback_id: "sidekick_actions",
                                    color: "#3AA3E3",
                                    attachment_type: "default",
                                    actions: [
                                      {
                                        name: "actions",
                                        text: "Keep me in Botmakers",
                                        type: "button",
                                        value: "mark_active",
                                      },
                                    ],
                                  },
                                ],
                              },
                              (message) => {
                                // NOOP
                              }
                            );
                          }
                        );

                        if (index === members.length - 1) {
                          bot.api.chat.postEphemeral({
                            channel: message_original.channel,
                            user: message_original.user,
                            text: "done!",
                          });
                        }
                      }, index * 1000);
                    }
                  });
                }
              });
            }
          });
        } else if (message.actions[0].value === "mark_active") {
          console.log(`marking user ${message_original.user} as active...`);

          controller.storage.users.get(message_original.user, (err, data) => {
            console.log(
              `loading user data for ${message_original.user}...`,
              { err },
              { data }
            );

            if (err || !data) {
              let data = {
                id: message_original.user,
              };
            }

            data.last_active = moment().format();

            // console.log(`loaded data for user ${message_original.user}...`, {data});

            controller.storage.users.save(data, (err, data) => {
              // console.log(`saved user ${message_original.user}`, {err}, {data});

              let reply = message_original;
              reply.text = "Thank you!";

              bot.replyInteractive(message_original, reply);

              // bot.api.im.open({
              //   user: message_original.user
              // }, (message, data) => {
              //   bot.api.chat.postMessage({
              //     channel: data.channel.id,
              //     text: 'Thank you!'
              //   }, (message) => {
              //     // NOOP
              //   });
              // });
            });
          });
        } else if (message.actions[0].value === "see_active_members") {
          console.log("processing...");

          bot.api.chat.postEphemeral({
            channel: message.channel,
            user: message.user,
            text: "_processing..._",
          });

          let attachments = [],
            attachment = {
              title: "Active members",
              color: "#36a64f",
              fields: [],
              mrkdwn_in: ["text,fields"],
            };

          bot.api.users.list({}, (err, data) => {
            if (!err && data.members) {
              let active_users = [],
                inactive_users = [],
                deleted_users = [],
                bots = [];

              // active_users = data.members.filter((member) => {
              //   return
              // });

              let actions = data.members.map((member) => {
                let action = new Promise((resolve, reject) => {
                  if (member.deleted) {
                    resolve(null);
                  } else {
                    controller.storage.users.get(member.id, (err, data) => {
                      if (data && data.last_active) {
                        member.__last_active = data.last_active;
                      }
                      resolve(member);
                    });
                  }
                });

                return action;
              });

              let results = Promise.all(actions);

              results.then(function (values) {
                values.forEach((member) => {
                  if (member) {
                    if (member.is_bot) {
                      bots.push(member);
                    } else if (
                      member.__last_active &&
                      moment().diff(member.__last_active, "days") < 32
                    ) {
                      active_users.push(member);
                    } else {
                      inactive_users.push(member);
                    }
                  } else {
                    deleted_users.push(member);
                  }
                });

                active_users = active_users.sort((a, b) => {
                  if (
                    a &&
                    b &&
                    a.hasOwnProperty("__last_active") &&
                    b.hasOwnProperty("__last_active") &&
                    moment().diff(a.__last_active, "minutes") <
                      moment().diff(b.__last_active, "minutes")
                  ) {
                    return -1;
                  } else if (
                    a &&
                    b &&
                    a.hasOwnProperty("__last_active") &&
                    b.hasOwnProperty("__last_active") &&
                    moment().diff(a.__last_active, "minutes") >
                      moment().diff(b.__last_active, "minutes")
                  ) {
                    return 1;
                  } else {
                    return 0;
                  }
                });

                let top_active_users = active_users.slice(0, 100);

                top_active_users.forEach((member) => {
                  attachment.fields.push({
                    value: `<@${member.name}> (${moment(
                      member.__last_active
                    ).fromNow()})`,
                    thumb_url: member.profile.image_192,
                    short: true,
                  });
                });

                attachment.title = `There are ${helpers.number_with_commas(
                  active_users.length
                )} active Botmakers members, here are ${
                  top_active_users.length
                } most recent:`;

                let bots_total = bots.length + 1; // The +1 is for @slackbot.

                attachment.fields.push({
                  value: `Also, there are ${helpers.number_with_commas(
                    bots_total
                  )} bots and ${helpers.number_with_commas(
                    inactive_users.length
                  )} inactive and ${helpers.number_with_commas(
                    deleted_users.length
                  )} deleted accounts.`,
                });

                attachments.push(attachment);

                bot.api.chat.postEphemeral({
                  channel: message.channel,
                  user: message.user,
                  text: "Here you go!",
                  attachments: attachments,
                });
              });
            }
          });
        } else if (message.actions[0].value === "remove_inactive_members") {
          console.log("cleaning up...");
          /* TODO: deactivate inactive users */
        } else if (message.actions[0].value === "show_cleanup_menu") {
          start_cleanup(bot, message);
        }
      }
    }
    next();
  });
};
