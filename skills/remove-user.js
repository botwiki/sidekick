/*********************************************************************************

Disable a Slack group member's account.

/sidekick remove @user

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  qs = require("qs"),
  helpers = require(__dirname + "/../helpers.js");

const explainRemoveUser = (bot, message_original) => {
  let attachments = [],
    attachment = {
      title: "Removing users from Slack group",
      color: "#333",
      fields: [],
      mrkdwn_in: ["fields"],
    };

  attachment.fields.push({
    value: "`/sidekick remove @user`",
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

    if (command === "remove") {
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
          let pattUserID = new RegExp(/(?:<@).*?(?:>)/gi);

          let message_arr = message_original.text.split(" "),
            remove_detect_user;

          console.log({ message_arr });

          if (message_arr && message_arr.length > 0) {
            remove_detect_user = message_arr[1];

            if (!remove_detect_user) {
              explainRemoveUser(bot, message_original);
            } else {
              // let remove_user_id = pattUserID.exec(remove_detect_user)[0].replace(/[<\|#>]/g, '').replace('@', '');
              let remove_user_id = remove_detect_user
                .split("|")[0]
                .replace(/[<\|#>]/g, "")
                .replace("@", "");

              if (remove_user_id) {
                console.log("removing user...", { remove_user_id });
                helpers.deactivate(
                  bot,
                  message_original,
                  remove_user_id,
                  () => {
                    let message_for_mods = `<@${message.user}> removed <@${remove_user_id}> from this group.`;
                    helpers.notify_mods(
                      bot,
                      null,
                      message_for_mods,
                      (err, data) => {}
                    );
                  }
                );
              } else {
                explainRemoveUser(bot, message_original);
              }
            }
          } else {
            explainRemoveUser(bot, message_original);
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
              explainRemoveUser(bot, message_original);
            }
          });
        }
      }
    }
    next();
  });
};
