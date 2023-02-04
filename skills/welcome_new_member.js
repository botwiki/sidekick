/*********************************************************************************
Weclome new members.

*********************************************************************************/

const wordfilter = require("wordfilter"),
  helpers = require(__dirname + "/../helpers.js"),
  channel_ids = require(__dirname + "/../channel_ids.js");

const sendWelcomeMessage = (controller, bot, message) => {
  console.log({
    "message.user_id:": message.user_id,
    "message.user.id:": message.user.id,
    "message.user:": message.user,
  });
  const userID = message.user.id || message.user_id || message.user;

  // console.log('sending out welcome message...\n', {message});
  // TODO: The ephemeral welcome message doesn't get triggered on team_join, only works with the testing slash command.

  setTimeout(() => {
    bot.api.chat.postEphemeral({
      channel: channel_ids.general,
      user: userID,
      text: `Hi <@${userID}>, come say hello! :wave:`,
    });
  }, 6000);

  if (controller.config.welcome_message) {
    bot.api.im.open(
      {
        user: userID,
      },
      (message, data) => {
        bot.api.chat.postMessage(
          {
            channel: data.channel.id,
            text: controller.config.welcome_message,
          },
          (message) => {
            // NOOP
          }
        );
      }
    );
  }
};

module.exports = (controller) => {
  controller.on("slash_command", (bot, message) => {
    const messageOriginal = message;
    let { command, args } = helpers.parse_slash_command(message);

    if (command === "test") {
      bot.replyAcknowledge();

      if (args[0] === "welcome") {
        sendWelcomeMessage(controller, bot, message);
      }
    }
  });

  controller.on("team_join", (bot, message) => {
    sendWelcomeMessage(controller, bot, message);
  });
};
