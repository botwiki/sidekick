/*********************************************************************************

Notify members when they receive reactions. 

*********************************************************************************/

const channelIDs = require(__dirname + "/../channel_ids.js");

module.exports = (controller) => {
  controller.on("reaction_added", (bot, message) => {
    const reactionMessage = message,
      reactionUser = message.user,
      reactionName = message.reaction,
      reactionChannel = message.item.channel;

    if (reactionChannel.charAt(0) === "C") {
      const messageTS = message.item.ts,
        messageURL = `https://${
          process.env.group_name
        }.slack.com/archives/${reactionChannel}/p${messageTS.replace(".", "")}`;

      bot.api.channels.info(
        {
          channel: reactionChannel,
        },
        (err, message) => {
          /* Notify the person receiving a reaction if it's still present after 10 seconds. */

          const notifyReactionReceiver = (msg) => {
            console.log("checking reactions...");
            bot.api.reactions.get(
              {
                timestamp: msg.item.ts,
                channel: msg.item.channel,
                name: msg.reaction,
              },
              (err, res) => {
                if (err) {
                  console.log("error\n", err);
                }

                console.log("more info about the reaction...", res.message);

                if (res.message.user) {
                  let originalMessageUser = res.message.user;
                }

                let originalReaction = message.reaction;

                if (res.message.reactions) {
                  let reactionsName = res.message.reactions.map((reaction) => {
                    return reaction.name;
                  });

                  // let notify_reaction = false;
                  let notify_reaction = true;

                  // for (let i = 0, j = reactionsName.length; i < j; i++){
                  //   if (encouraging_reactions.indexOf(reactionsName[i]) > -1){
                  //     console.log('notifying about reaction in 10...9...8...');
                  //     notify_reaction = true;
                  //   }
                  // }

                  if (notify_reaction) {
                    controller.storage.users.get(
                      originalMessageUser,
                      (err, data) => {
                        console.log(
                          `loading user data for ${originalMessageUser}...`,
                          { err },
                          { data }
                        );
                        if (
                          data &&
                          data.reaction_notifications &&
                          data.reaction_notifications == "true"
                        ) {
                          console.log("notifying about reaction...");

                          bot.api.im.open(
                            {
                              user: originalMessageUser,
                            },
                            (message, data) => {
                              let attachments = [
                                {
                                  fallback: "Unable to render buttons.",
                                  callback_id: "sidekick_actions",
                                  color: "#3AA3E3",
                                  attachment_type: "default",
                                  actions: [],
                                },
                              ];

                              attachments[0].actions.push({
                                name: "actions",
                                text: "Don't show these",
                                type: "button",
                                value: "disable_reaction_notifications",
                              });

                              bot.api.chat.postMessage(
                                {
                                  channel: data.channel.id,
                                  text: `<@${reactionUser}> left a :${reactionName}: reaction on your post in <#${reactionChannel}>:\n\n${messageURL}`,
                                  attachments: attachments,
                                },
                                (message) => {
                                  // NOOP
                                }
                              );
                            }
                          );
                        } else {
                          console.log(
                            "user disabled reaction notifications..."
                          );
                        }
                      }
                    );
                  }
                } else {
                  console.log("no reactions found");
                }
              }
            );
          };

          setTimeout(() => {
            console.log("checking if reaction still exists...");
            notifyReactionReceiver(reactionMessage);
          }, 5000);
        }
      );
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    let messageOriginal = message;
    if (message.type == "interactive_message_callback") {
      console.log("message_actions\n", message.actions);

      if (message.actions[0].name === "actions") {
        if (message.actions[0].value === "disable_reaction_notifications") {
          controller.storage.users.get(messageOriginal.user, (err, data) => {
            console.log(
              `loading user data for ${messageOriginal.user}...`,
              { err },
              { data }
            );

            if (err || !data) {
              let data = {
                id: messageOriginal.user,
              };
            }

            data.reaction_notifications = "false";

            controller.storage.users.save(data, (err, data) => {
              console.log(
                `saved user ${messageOriginal.user}`,
                { err },
                { data }
              );

              bot.api.im.open(
                {
                  user: messageOriginal.user,
                },
                (message, data) => {
                  let attachments = [
                    {
                      fallback: "Unable to render buttons.",
                      callback_id: "sidekick_actions",
                      color: "#3AA3E3",
                      attachment_type: "default",
                      actions: [],
                    },
                  ];

                  attachments[0].actions.push({
                    name: "actions",
                    text: "Show reaction notifications",
                    type: "button",
                    value: "enable_reaction_notifications",
                  });

                  bot.api.chat.postMessage(
                    {
                      channel: data.channel.id,
                      text: `Let me know if you change your mind!`,
                      attachments: attachments,
                    },
                    (message) => {
                      // NOOP
                    }
                  );
                }
              );
            });
          });
        } else if (
          message.actions[0].value === "enable_reaction_notifications"
        ) {
          controller.storage.users.get(messageOriginal.user, (err, data) => {
            console.log(
              `loading user data for ${messageOriginal.user}...`,
              { err },
              { data }
            );

            if (err || !data) {
              let data = {
                id: messageOriginal.user,
              };
            }

            data.reaction_notifications = "true";

            controller.storage.users.save(data, (err, data) => {
              console.log(
                `saved user ${messageOriginal.user}`,
                { err },
                { data }
              );

              bot.api.im.open(
                {
                  user: messageOriginal.user,
                },
                (message, data) => {
                  let attachments = [
                    {
                      fallback: "Unable to render buttons.",
                      callback_id: "sidekick_actions",
                      color: "#3AA3E3",
                      attachment_type: "default",
                      actions: [],
                    },
                  ];

                  attachments[0].actions.push({
                    name: "actions",
                    text: "Don't show reaction notifications",
                    type: "button",
                    value: "disable_reaction_notifications",
                  });

                  bot.api.chat.postMessage(
                    {
                      channel: data.channel.id,
                      text: `Alrighty!`,
                      attachments: attachments,
                    },
                    (message) => {
                      // NOOP
                    }
                  );
                }
              );
            });
          });
        }
      }
    }
    next();
  });
};
