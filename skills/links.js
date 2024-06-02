/*********************************************************************************

Links to projects should be posted to the #projects channel, not #general.
Remind people to submit their bots to Botwiki.

*********************************************************************************/

const wordfilter = require("wordfilter"),
  channel_ids = require(__dirname + "/../channel_ids.js");

module.exports = (controller) => {
  controller.on("ambient", (bot, message) => {
    let messageText = message.text.toLowerCase().replace(/\s+/g, " ").trim();

    // console.log('ambient\n', message.channel, messageText);

    console.log({
      "message.channel": message.channel,
      "channel_ids.general": channel_ids.general,
      "channel_ids.testing": channel_ids.testing,
      "channel_ids.testing_private": channel_ids.testing_private,
    });

    if (
      (message.channel === channel_ids.general ||
        message.channel === channel_ids.testing ||
        message.channel === channel_ids.testing_private) &&
      (messageText.indexOf("http://") > -1 ||
        messageText.indexOf("https://") > -1)
    ) {
      bot.api.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        text:
          "Posting a link? Consider moving your message to a more appropriate channel:\n\n" +
          ` - <#${channel_ids.projects}>\n` +
          ` - <#${channel_ids.help}>\n` +
          ` - <#${channel_ids.tools_resources}>\n` +
          ` - <#${channel_ids.news}>\n`,
      });
    } else if (
      message.channel === channel_ids.projects &&
      (messageText.indexOf("http://") > -1 ||
        messageText.indexOf("https://") > -1)
    ) {
      bot.api.chat.postEphemeral({
        channel: message.channel,
        user: message.user,
        text: "Posting a new bot? Remember to add it to Botwiki! botwiki.org/submit-your-bot\n\nPromoting a new product or service? Try the <#C06A6JV0DE1> channel instead.",
      });
    } else {
      // console.log(message.channel, messageText.indexOf('http://'));
    }
  });
};
