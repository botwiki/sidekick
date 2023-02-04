/*********************************************************************************

Wave back to folks saying hello. (#general channel only)

*********************************************************************************/

const channelIDs = require(__dirname + "/../channel_ids.js");

module.exports = (controller) => {
  controller.hears(
    [
      "hi everyone",
      "hello everyone",
      "good morning",
      "happy friday",
      "happy monday",
    ],
    "ambient",
    (bot, message) => {
      if (
        message.channel === channelIDs.general ||
        message.channel === channelIDs.testing ||
        message.channel === channelIDs.testing_private
      ) {
        bot.api.reactions.add(
          {
            timestamp: message.ts,
            channel: message.channel,
            name: "wave",
          },
          (err, res) => {
            if (err) {
              console.log("error\n", err);
            }
          }
        );
      }
    }
  );
};
