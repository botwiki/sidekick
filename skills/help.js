/*********************************************************************************
Get to know your Sidekick.

/sidekick help

*********************************************************************************/

const request = require("request"),
  fs = require("fs"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js"),
  wordfilter = require("wordfilter"),
  lockdown_status = null;

const aboutThisGroup = (controller, bot, message) => {
  const attachments = [
    {
      fallback: "Unable to render buttons.",
      callback_id: "sidekick_actions",
      color: "#3AA3E3",
      attachment_type: "default",
      actions: [],
    },
  ];

  controller.storage.teams.all((err, all_team_data) => {
    lockdown_status = all_team_data[0].lockdown;
    console.log({ lockdown_status });

    helpers.is_admin(bot, message, (err) => {
      attachments[0].actions.push({
        name: "actions",
        text: "Who's online?",
        type: "button",
        value: "learn_more_members",
      });

      if (!err) {
        attachments[0].actions.push({
          name: "actions",
          text: "See active members",
          type: "button",
          value: "see_active_members",
        });
      }

      attachments[0].actions.push({
        name: "actions",
        text: "Our bots",
        type: "button",
        value: "learn_more_bots",
      });

      // if (!err){
      //   attachments[0].actions.push(
      //     {
      //       'name': 'actions',
      //       'text': 'Cleanup*',
      //       'type': 'button',
      //       'value': 'show_cleanup_menu'
      //     }
      //   );
      // }

      let response_data = {
        channel: message.channel,
        user: message.user,
        text: "",
        attachments: attachments,
      };

      if (message.channel.charAt(0) === "D") {
        bot.api.chat.postMessage(response_data, (err, data) => {
          console.log({ err, data });
        });
      } else {
        bot.api.chat.postEphemeral(response_data, (err, data) => {
          console.log({ err, data });
        });
      }
    });
  });
};
const groupSettings = (controller, bot, message) => {
  const attachments = [
    {
      fallback: "Unable to render buttons.",
      callback_id: "sidekick_actions",
      color: "#3AA3E3",
      attachment_type: "default",
      actions: [],
    },
  ];

  controller.storage.teams.all((err, all_team_data) => {
    lockdown_status = all_team_data[0].lockdown;
    console.log({ lockdown_status });

    helpers.is_admin(bot, message, (err) => {
      let is_admin = !err;

      controller.storage.users.get(message.user, (err, data) => {
        console.log(
          `loading user data for ${message.user}...`,
          { err },
          { data }
        );
        if (
          data &&
          data.reaction_notifications &&
          data.reaction_notifications == "true"
        ) {
          attachments[0].actions.push({
            name: "actions",
            text: "Don't show reaction notifications",
            type: "button",
            value: "disable_reaction_notifications",
          });
        } else {
          attachments[0].actions.push({
            name: "actions",
            text: "Show reaction notifications",
            type: "button",
            value: "enable_reaction_notifications",
          });
        }

        // if (is_admin){
        // }

        let response_data = {
          channel: message.channel,
          user: message.user,
          text: "",
          attachments: attachments,
        };

        if (message.channel.charAt(0) === "D") {
          bot.api.chat.postMessage(response_data, (err, data) => {
            console.log({ err, data });
          });
        } else {
          bot.api.chat.postEphemeral(response_data, (err, data) => {
            console.log({ err, data });
          });
        }
      });
    });
  });
};

const sidekickHelp = (response_type, controller, bot, message) => {
  let attachments = [
    {
      fallback: "Unable to render buttons.",
      callback_id: "sidekick_actions",
      color: "#3AA3E3",
      attachment_type: "default",
      actions: [],
    },
  ];

  controller.storage.teams.all((err, all_team_data) => {
    lockdown_status = all_team_data[0].lockdown;
    console.log({ lockdown_status });

    helpers.is_admin(bot, message, (err) => {
      let is_admin = !err;

      attachments[0].actions.push({
        name: "actions",
        text: "About this group",
        type: "button",
        value: "learn_more",
      });

      // if (!err){
      //   attachments[0].actions.push(
      //     {
      //       'name': 'actions',
      //       'text': 'Cleanup*',
      //       'type': 'button',
      //       'value': 'show_cleanup_menu'
      //     }
      //   );
      // }

      attachments[0].actions.push({
        name: "actions",
        text: "Group settings",
        type: "button",
        value: "groupSettings",
      });

      if (!is_admin) {
        attachments[0].actions.push({
          name: "actions",
          text: "Contact moderators",
          type: "button",
          value: "contact_moderators",
        });
      }

      if (is_admin) {
        attachments[0].actions.push({
          name: "actions",
          text: "Moderator commands",
          type: "button",
          value: "moderator_commands",
        });
      }

      if (is_admin && lockdown_status === false) {
        attachments[0].actions.push({
          name: "actions",
          text: "Lockdown",
          style: "danger",
          type: "button",
          value: "lockdown_activate",
          confirm: {
            title: "Are you sure?",
            text: "This will prevent members from posting any messages.",
            ok_text: "Go ahead",
            dismiss_text: "Never mind",
          },
        });
      }

      if (is_admin && lockdown_status === true) {
        attachments[0].actions.push({
          name: "actions",
          text: "Cancel lockdown",
          style: "danger",
          type: "button",
          value: "lockdown_deactivate",
          confirm: {
            title: "Are you sure?",
            text: "Please confirm that you want to cancel the lockdown.",
            ok_text: "Confirm",
            dismiss_text: "Not yet",
          },
        });
      }

      if (!is_admin) {
        attachments[0].actions.push({
          name: "actions",
          text: "Delete my account",
          style: "danger",
          type: "button",
          value: "delete_account",
          confirm: {
            title: "Are you sure?",
            text: "You can always contact stefan@botwiki.org to re-activate your account.",
            ok_text: "Yes",
            dismiss_text: "No",
          },
        });
      }

      let response_data = {
        channel: message.channel,
        user: message.user,
        text: "Hi, I'm Sidekick! How can I help?",
        attachments: attachments,
      };

      if (response_type === "public") {
        bot.api.chat.postMessage(response_data, (err, data) => {
          console.log({ err, data });
        });
      } else {
        bot.api.chat.postEphemeral(response_data, (err, data) => {
          console.log({ err, data });
        });
      }
    });
  });
};

module.exports = (controller) => {
  controller.hears(
    ["who are you", "what can you do", "hello", "help", "manual"],
    "direct_message,direct_mention",
    (bot, message) => {
      let message_original = message;
      if (!wordfilter.blacklisted(message.match[1])) {
        sidekickHelp("public", controller, bot, message);
      } else {
        bot.reply(message, "_sigh_");
      }
    }
  );

  controller.on("slash_command", (bot, message) => {
    bot.replyAcknowledge();

    let { command, args } = helpers.parse_slash_command(message);

    if (command === "" || command === "help") {
      sidekickHelp("private", controller, bot, message);
    }
  });

  controller.middleware.receive.use((bot, message, next) => {
    let message_original = message;
    if (message.type == "interactive_message_callback") {
      console.log("message_actions\n", message.actions);

      if (message.actions[0].name === "actions") {
        if (message.actions[0].value === "learn_more") {
          aboutThisGroup(controller, bot, message);
        } else if (message.actions[0].value === "learn_more_members") {
          helpers.get_group_info(bot, message, (err, data) => {
            let response_data = {
              channel: message_original.channel,
              user: message_original.user,
              attachments: data,
            };

            if (message_original.channel.charAt(0) === "D") {
              bot.api.chat.postMessage(response_data);
            } else {
              bot.api.chat.postEphemeral(response_data);
            }
          });
        } else if (message.actions[0].value === "learn_more_bots") {
          helpers.get_bot_info(bot, message, (err, data) => {
            let response_data = {
              channel: message_original.channel,
              user: message_original.user,
              attachments: data,
            };

            if (message_original.channel.charAt(0) === "D") {
              bot.api.chat.postMessage(response_data);
            } else {
              bot.api.chat.postEphemeral(response_data);
            }
          });
        } else if (message.actions[0].value === "group_ettings") {
          groupSettings(controller, bot, message);
        } else if (message.actions[0].value === "contact_moderators") {
          bot.api.dialog.open(
            {
              trigger_id: message.trigger_id,
              dialog: JSON.stringify({
                callback_id: "send_moderators_message",
                title: "Contact moderators",
                submit_label: "Send",
                elements: [
                  {
                    type: "textarea",
                    label: "Your message",
                    name: "message",
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
        }
      }
    }
    next();
  });
};
