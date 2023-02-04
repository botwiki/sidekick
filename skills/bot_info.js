/*********************************************************************************
List bots added to the group.

/sidekick bots

*********************************************************************************/

const request = require("request"),
  wordfilter = require("wordfilter"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js");

module.exports = (controller) => {
  controller.hears(
    ["list bots", "list all bots", "what bots are here"],
    "direct_message,direct_mention",
    (bot, message) => {
      let messageOriginal = message;
      if (!wordfilter.blacklisted(message.match[1])) {
        helpers.get_bot_info(bot, message, (err, data) => {
          bot.reply(messageOriginal, {
            attachments: data,
          });
        });
      } else {
        bot.reply(message, "_sigh_");
      }
    }
  );

  controller.on("slash_command", (bot, message) => {
    let messageOriginal = message;
    let messageText_arr = message.text.split(" ");
    let command = messageText_arr[0],
      channel = helpers.parse_channel_ids(messageText_arr[1])[0];

    if (command === "bots") {
      // bot.replyAcknowledge();

      helpers.get_bot_info(bot, message, (err, data) => {
        bot.api.chat.postEphemeral({
          channel: messageOriginal.channel,
          user: messageOriginal.user,
          attachments: data,
        });
      });
    }
  });
};
