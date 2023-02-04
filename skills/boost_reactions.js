/*********************************************************************************

Boost positive reactions. 

*********************************************************************************/

const channel_ids = require(__dirname + "/../channel_ids.js"),
  encouraging_reactions = ["wave", "clap", "tada", "heart"];

module.exports = (controller) => {
  controller.on("reaction_added", (bot, message) => {
    let original_message = message,
      message_user = message.user,
      message_reaction = message.reaction,
      message_channel = message.item.channel;

    if (message_channel.charAt(0) === "C") {
      /* Ignore private channels. */
      bot.api.channels.info(
        {
          channel: message_channel,
        },
        (err, message) => {
          console.log(`new reaction ${message_reaction} in ${message_channel}`);

          if (encouraging_reactions.indexOf(message_reaction) > -1) {
            /* Boost "encouraging reactions", if they're still present after 10 seconds. */
            console.log("detected boostable reaction...");

            const boostReaction = (msg) => {
              console.log("checking reactions...");
              bot.api.reactions.get(
                {
                  timestamp: msg.item.ts,
                  channel: msg.item.channel,
                  name: msg.reaction,
                },
                (err, res) => {
                  if (err) {
                    console.log("error\n", err);
                  }
                  // console.log('res.message.reactions', res.message.reactions);

                  let original_reaction = message.reaction;

                  if (res.message.reactions) {
                    let message_reactions = res.message.reactions.map(
                      (reaction) => {
                        return reaction.name;
                      }
                    );

                    let boost_reaction = false;

                    for (let i = 0, j = message_reactions.length; i < j; i++) {
                      if (
                        encouraging_reactions.indexOf(message_reactions[i]) > -1
                      ) {
                        console.log("boosting reaction in 10...9...");
                        boost_reaction = true;
                      }
                    }

                    if (boost_reaction) {
                      console.log("boosting reaction...");
                      bot.api.reactions.add(
                        {
                          timestamp: res.message.ts,
                          channel: res.channel,
                          name: message_reaction,
                        },
                        (err, res) => {
                          if (err) {
                            console.log("error\n", err);
                          }
                        }
                      );
                    } else {
                      console.log("reaction was removed");
                    }
                  } else {
                    console.log("no reactions found");
                  }
                }
              );
            };

            setTimeout(() => {
              console.log("checking if reaction still boostable...");
              boostReaction(original_message);
            }, 10000);
          }
        }
      );
    }
  });
};
