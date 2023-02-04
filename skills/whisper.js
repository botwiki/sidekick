/*********************************************************************************
Send an ephemeral message to a group member.

/sidekick whisper @username #channel MESSAGE

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js"),
  wordfilter = require("wordfilter");

const explain_whisper = (bot, message_original) => {
  let attachments = [],
    attachment = {
      title: "Sending whispers",
      color: "#333",
      fields: [],
      mrkdwn_in: ["fields"],
    };

  attachment.fields.push({
    value: "`/sidekick whisper @user #channel MESSAGE`",
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

    if (command === "whisper") {
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
          let patt_user_id = new RegExp(/(?:<@).*?(?:>)/gi),
            patt_channel_id = new RegExp(/<#.*\|/g);

          let message_arr = message_original.text.split(" "),
            whisper_detect_user,
            whisper_detect_channel,
            whisper_text,
            whisper_channel;

          console.log({ message_arr });

          if (message_arr && message_arr.length > 3) {
            if (message_arr[1].indexOf("<@") > -1) {
              whisper_detect_user = message_arr[1];
            } else if (message_arr[2].indexOf("<@") > -1) {
              whisper_detect_user = message_arr[2];
            }

            if (!whisper_detect_user) {
              explain_whisper(bot, message_original);
            } else {
              // let whisper_user = patt_user_id.exec(whisper_detect_user)[0].replace(/[<\|#>]/g, '').replace('@', '');
              let whisper_user = whisper_detect_user
                .split("|")[0]
                .replace(/[<\|#>]/g, "")
                .replace("@", "");

              if (message_arr[1].indexOf("<#") > -1) {
                whisper_detect_channel = message_arr[1];
              } else if (message_arr[2].indexOf("<#") > -1) {
                whisper_detect_channel = message_arr[2];
              }

              whisper_channel = patt_channel_id
                .exec(whisper_detect_channel)[0]
                .replace(/[<\|#>]/g, "");

              whisper_text = message_arr.slice(3).join(" ");

              if (whisper_channel && whisper_user && whisper_text) {
                console.log("whisper_user", whisper_user);
                console.log("whisper_channel", whisper_channel);
                console.log("whisper_text", whisper_text);

                bot.api.chat.postEphemeral({
                  channel: whisper_channel,
                  user: whisper_user,
                  text: `<@${whisper_user}> ${whisper_text}`,
                });

                if (message_original.user !== whisper_user) {
                  let message_for_mods = `<@${message.user}> whispered to <@${whisper_user}> in <#${whisper_channel}>:\n\n>>>${whisper_text}`;
                  helpers.notify_mods(
                    bot,
                    null,
                    message_for_mods,
                    (err, data) => {}
                  );
                }
              } else {
                explain_whisper(bot, message_original);
              }
            }
          } else {
            explain_whisper(bot, message_original);
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
              explain_whisper(bot, message_original);
            }
          });
        }
      }
    }
    next();
  });
};
