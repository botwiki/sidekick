/*********************************************************************************
Send an ephemeral message to a group member.

/sidekick dm @username MESSAGE

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js"),
  wordfilter = require("wordfilter");

const explainSendDM = (bot, message_original) => {
  let attachments = [],
    attachment = {
      title: "Sending DMs",
      color: "#333",
      fields: [],
      mrkdwn_in: ["fields"],
    };

  attachment.fields.push({
    value: "`/sidekick dm @user MESSAGE`",
  });

  attachments.push(attachment);

  bot.api.chat.postEphemeral({
    channel: message_original.channel,
    user: message_original.user,
    attachments: JSON.stringify(attachments),
  });
};

module.exports = (controller) => {
  controller.on("slash_command", (bot, message, cb) => {
    let message_original = message,
      message_text_arr = message.text.split(" "),
      command = message_text_arr[0];

    if (command === "dm") {
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, (err) => {
        if (err) {
          bot.api.chat.postEphemeral({
            channel: message_original.channel_id,
            user: message_original.user_id,
            text: err.error_message,
          });
        } else {
          /* TODO: This code is a bit messy, clean up later! */
          let patt_user_id = new RegExp(/(?:<@).*?(?:>)/gi);

          let message_arr = message_original.text.split(" ");
          dm_detect_user, dm_text;

          console.log({ message_arr });

          if (message_arr && message_arr.length > 2) {
            dm_detect_user = message_arr[1];

            // let dm_user = patt_user_id.exec(dm_detect_user)[0].replace(/[<\|#>]/g, '').replace('@', '');
            let dm_user = dm_detect_user
                .split("|")[0]
                .replace(/[<\|#>]/g, "")
                .replace("@", ""),
              dm_text = message_arr.slice(2).join(" ");
            console.log({ dm_user }, { dm_text });

            if (dm_user && dm_text) {
              bot.api.im.open(
                {
                  user: dm_user,
                },
                (message, data) => {
                  bot.api.chat.postMessage(
                    {
                      channel: data.channel.id,
                      text: dm_text,
                    },
                    (message) => {
                      // NOOP
                    }
                  );
                }
              );

              if (message_original.user !== dm_user) {
                let message_for_mods = `<@${message.user}> sent a DM to <@${dm_user}>:\n\n>>>${dm_text}`;
                helpers.notify_mods(
                  bot,
                  message.user_id,
                  message_for_mods,
                  (err, data) => {}
                );
              }
            } else {
              console.log(1);
              explainSendDM(bot, message_original);
            }
          } else {
            console.log(2);
            explainSendDM(bot, message_original);
          }
        }
      });
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    let message_original = message;
    if (message.type == "interactive_message_callback") {
      console.log("message_actions\n", message.actions);

      if (message.actions[0].name === "actions") {
        if (message.actions[0].value === "moderator_commands") {
          helpers.is_admin(bot, message, (err) => {
            if (!err) {
              explainSendDM(bot, message_original);
            }
          });
        }
      }
    }
    next();
  });
};
