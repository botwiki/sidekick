/*********************************************************************************
Send a message to all moderators.

/sidekick mods Hello, this is for the group moderators.

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js"),
  wordfilter = require("wordfilter");

module.exports = (controller) => {
  controller.hears(
    [
      "forward to mods",
      "forward to moderators",
      "for mods",
      "for moderators",
      "forward to admins",
      "for admins",
    ],
    "direct_message,direct_mention",
    (bot, message) => {
      let messageOriginal = message;
      if (!wordfilter.blacklisted(message.match[1])) {
        helpers.notify_mods(
          bot,
          message.event.user,
          message.text,
          (err, data) => {
            if (err) {
              bot.api.chat.postMessage({
                channel: messageOriginal.channel,
                user: messageOriginal.user,
                text: `There was an error: ${err.error_message}.`,
              });
            } else {
              bot.api.chat.postMessage({
                channel: messageOriginal.channel,
                user: messageOriginal.user,
                text: "Thank you! Someone from the Botmakers team will follow up with you soon.",
              });
            }
          }
        );
      } else {
        bot.reply(message, "_sigh_");
      }
    }
  );

  controller.on("dialog_submission", (bot, event) => {
    bot.replyAcknowledge();
    let submission = event.submission;

    if (event.callback_id === "send_moderators_message") {
      console.log({ event }, { submission });
      helpers.notify_mods(bot, event.user, submission.message, (err, data) => {
        if (err) {
          bot.api.chat.postEphemeral({
            channel: event.channel,
            user: event.user,
            text: `There was an error: ${err.error_message}.`,
          });
        } else {
          bot.api.chat.postEphemeral({
            channel: event.channel,
            user: event.user,
            text: "Thank you! Someone from the Botmakers team will follow up with you soon.",
          });
        }
      });
    }
  });

  controller.on("slash_command", (bot, message, cb) => {
    let messageOriginal = message,
      messageTextArr = message.text.split(" "),
      command = messageTextArr[0];

    if (command === "mods") {
      let messageForMods = message.text.replace("mods", "");
      helpers.notify_mods(bot, message.user_id, messageForMods, (err, data) => {
        if (err) {
          bot.api.chat.postEphemeral({
            channel: messageOriginal.channel,
            user: messageOriginal.user,
            text: `There was an error: ${err.error_message}.`,
          });
        } else {
          bot.api.chat.postEphemeral({
            channel: messageOriginal.channel,
            user: messageOriginal.user,
            text: "Thank you! Someone from the Botmakers team will follow up with you soon.",
          });
        }
      });
    }
  });
};
