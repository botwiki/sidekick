/*********************************************************************************
Lock down the Slack group.

/sidekick lockdown [off]

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js"),
  channel_ids = require(__dirname + "/../channel_ids.js");

var lockdownStatus = false;

function updateLockdownStatus(controller, message, lockdownStatus) {
  console.log({ message });
  var team_id = message.team_id || message.team.id;

  controller.storage.teams.get(team_id, (err, data) => {
    if (!err) {
      data.lockdown = lockdownStatus;
      console.log(lockdownStatus);
      controller.storage.teams.save(data, (err, data) => {
        //NOOP
      });
    }
  });
}

function lockdown_activate(controller, bot, message) {
  lockdownStatus = true;

  bot.api.chat.postMessage({
    channel: channel_ids.general,
    text: `<@${message.user}> initiated lockdown, all posts will be deleted until lockdown is disabled.`,
  });

  bot.api.chat.postEphemeral({
    channel: message.channel,
    user: message.user,
    text: "Lockdown initiated. To disable, please use `/sidekick lockdown off`.",
  });

  updateLockdownStatus(controller, message, lockdownStatus);
}

const lockdown_deactivate = (controller, bot, message) => {
  lockdownStatus = false;

  bot.api.chat.postMessage({
    channel: channel_ids.general,
    text: `<@${message.user}> cancelled lockdown.`,
  });

  bot.api.chat.postEphemeral({
    channel: message.channel,
    user: message.user,
    text: "Lockdown cancelled.",
  });

  updateLockdownStatus(controller, message, lockdownStatus);
};

module.exports = (controller) => {
  controller.storage.teams.all((err, all_team_data) => {
    console.log("lockdown status: ", all_team_data[0].lockdown);
    lockdownStatus = all_team_data[0].lockdown;
  });

  controller.on("mention,direct_mention,ambient", (bot, message) => {
    console.log({ lockdownStatus });
    if (lockdownStatus === true) {
      bot.api.chat.delete(
        {
          token: process.env.superToken,
          channel: message.channel,
          ts: message.ts,
        },
        (err, message) => {
          if (err) {
            console.log("error:\n", err);
          }
        }
      );
    }
  });

  controller.on("slash_command", (bot, message, cb) => {
    var bot = bot,
      message_original = message,
      { command, args } = helpers.parse_slash_command(message);

    if (command === "lockdown") {
      bot.replyAcknowledge();

      helpers.is_admin(bot, message, (err) => {
        if (err) {
          bot.api.chat.postEphemeral({
            channel: message_original.channel_id,
            user: message_original.user_id,
            text: err.error_message,
          });
        } else {
          if (args[0] === "off") {
            lockdown_deactivate(controller, bot, message_original);
          } else {
            lockdown_activate(controller, bot, message_original);
          }
        }
      });
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    bot.replyAcknowledge();

    var message_original = message;
    if (message.type == "interactive_message_callback") {
      console.log("message_actions\n", message.actions);

      if (message.actions[0].name === "actions") {
        if (message.actions[0].value === "lockdown_activate") {
          helpers.is_admin(bot, message, (err) => {
            if (!err) {
              lockdown_activate(controller, bot, message);
            }
          });
        } else if (message.actions[0].value === "lockdown_deactivate") {
          helpers.is_admin(bot, message, (err) => {
            if (!err) {
              lockdown_deactivate(controller, bot, message);
            }
          });
        }
      }
    }
    next();
  });
};
