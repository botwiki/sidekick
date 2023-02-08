const fs = require("fs"),
  fsPath = require("fs-path"),
  util = require("util"),
  request = require("request"),
  jsdom = require("jsdom"),
  generators = {
    overlay: require(__dirname + "/generators/overlay.js"),
  },
  // twitter = require(__dirname + "/twitter.js"),
  helpers = require(__dirname + "/helpers.js"),
  moment = require("moment"),
  channel_ids = require(__dirname + "/channel_ids.js");

const mastodon = require("./networks/mastodon.js");

module.exports = (controller) => {
  return [
    {
      description: "notify inactive members, deactivate inactive accounts",
      interval: "* * * * *",
      job: () => {
        helpers.cleanup(controller);
      },
    },
    {
      description: "check botsin.space for new bots",
      interval: "* * * * *",
      job: () => {
        console.log("checking for new bots on botsin.space...");
        controller.storage.teams.all((err, all_team_data) => {
          let bot = controller.spawn({ token: all_team_data[0].token });
          let botsinspaceBots = [];

          fs.readFile(
            __dirname + "/.data/botsinspace-bots.txt",
            "utf8",
            function (err, data) {
              if (!err) {
                botsinspaceBots = JSON.parse(data);
              }

              console.log(`debug: ${botsinspaceBots.length}`)

              let new_bots_maybe = [];

              mastodon.M.get("timelines/public", {
                local: true,
                limit: 40,
              }).then((res) => {
                let statuses = res.data;
                statuses.forEach((status) => {
                  // console.log(status);

                  if (botsinspaceBots.indexOf(status.account.url) === -1) {
                    // console.log('new bot?', status.account.url);
                    botsinspaceBots.push(status.account.url);
                    new_bots_maybe.push(status.account.url);

                    console.log("forwarding", {
                      "channel_ids.twitter_feed": channel_ids.twitter_feed,
                      "process.env.channel_twitter_feed":
                        process.env.channel_twitter_feed,
                      // controller,
                      // bot
                    });

                    const botURL = `https://botsin.space/@${status.account.username}`;
                    const botwikiSubmitURL = `https://metascraper.stefanbohacek.dev/?url=${ botURL }&mode=botwiki`
                    let r = request.get(botwikiSubmitURL, (err, res, body) => {
                      let submitURL = '';

                      try{
                        // console.log(body);
                        body = JSON.parse(body);
                        submitURL = body.submit_url;
                      } catch(err){
                        /* noop */  
                      }
                      
                      const { JSDOM } = jsdom;
                      const content = JSDOM.fragment(status.content).textContent;

                      bot.api.chat.postMessage(
                        {
                          channel: channel_ids.twitter_feed,
                          // title: '',
                          // text: tweet_url,
                          attachments: [
                            {
                              text: `<@stefan> New bot?\n>${content}\n\n<${submitURL}|Submit to Botwiki>`,
                              author_name: `@${
                                status.account.display_name ||
                                status.account.username
                              }`,
                              author_link: botURL,
                              author_icon: status.account.avatar_static,
                              footer: status.url,
                              // 'footer_icon': 'https://platform.slack-edge.com/img/default_application_icon.png',
                              // 'fallback': `@${tweet.user.screen_name}: ${tweet_text_parsed}`,
                              callback_id: "sidekick_actions",
                              color: "#e8e8e8",
                              attachment_type: "default",
                              actions: [
                                {
                                  name: "boost_toot",
                                  text: "Boost",
                                  type: "button",
                                  value: status.uri,
                                  confirm: {
                                    title: "Please confirm",
                                    text: `Are you sure you want to boost this toot from ${status.account.display_name}?`,
                                    ok_text: "Yes",
                                    dismiss_text: "No",
                                  },
                                },
                                {
                                  name: "boost_and_prompt",
                                  text: "Boost+Prompt",
                                  type: "button",
                                  value: status.uri,
                                  confirm: {
                                    title: "Please confirm",
                                    text: `Are you sure you want to boost this toot from ${status.account.display_name} and ask them to submit their bot to Botwiki?`,
                                    ok_text: "Yes",
                                    dismiss_text: "No",
                                  },
                                },
                                // {
                                //   "type": "button",
                                //   "text": "Submit",
                                //   "url": body.submit_url
                                // },
                                {
                                  name: "submit_to_botwiki",
                                  text: "Submit",
                                  type: "button",
                                  value: status.uri,
                                  confirm: {
                                    title: "Please confirm",
                                    text: `Are you sure you want submit this bot to Botwiki?`,
                                    ok_text: "Yes",
                                    dismiss_text: "No",
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        (err) => {
                          if (err) {
                            console.log({ err });
                          }
                        }
                      );
  
                      fs.writeFileSync(
                        __dirname + "/.data/botsinspace-bots.txt",
                        JSON.stringify(botsinspaceBots)
                      );                      
                      

                    });                    

                    
                  }
                });
                // console.log(botsinspaceBots);
                console.log({ new_bots_maybe });

                if (new_bots_maybe.length > 0) {
                  fs.writeFileSync(
                    __dirname + "/.data/botsinspace-bots.txt",
                    JSON.stringify(botsinspaceBots)
                  );
                }
              });
            }
          );
        });
      },
    },
    {
      description: "update last active statuses based on login information",
      interval: "*/10 * * * *",
      job: () => {
        controller.storage.teams.all((err, all_team_data) => {
          let bot = controller.spawn({ token: all_team_data[0].token });
          bot.api.team.accessLogs(
            { token: process.env.superToken },
            (err, data) => {
              // console.log({data});
              data.logins.forEach((member) => {
                if (member.date_last) {
                  let active_time = moment.unix(member.date_last).format();
                  helpers.update_last_active_time(
                    controller,
                    bot,
                    member.user_id,
                    active_time
                  );
                }
              });
            }
          );
        });
      },
    },
    {
      description: "post group info into #logs once every hour",
      // interval: '0 * * * *',
      // interval: '*/1 * * * *',
      interval: "*/30 * * * *",
      job: () => {
        controller.storage.teams.all((err, all_team_data) => {
          let bot = controller.spawn({ token: all_team_data[0].token });
          helpers.get_group_info(bot, null, (err, data) => {
            helpers.log_event(bot, "", data);
          });
        });
      },
    },
    {
      description: "update profile picture on Twitter",
      interval: "*/30 * * * *",
      job: () => {
//         twitter.get_tweet_image((tweet_media) => {
//           let w = 500,
//             h = 500,
//             tweet_media_w = tweet_media.sizes.large.w,
//             tweet_media_h = tweet_media.sizes.large.h,
//             aspect_ratio = 1;

//           if (tweet_media_w < w) {
//             tweet_media_w = w;
//             aspect_ratio = w / tweet_media_w;
//             tweet_media_h = h * aspect_ratio;
//           }

//           if (tweet_media_h < h) {
//             tweet_media_h = h;
//             aspect_ratio = h / tweet_media_h;
//             tweet_media_w = w * aspect_ratio;
//           }

//           generators.overlay.overlay_images(
//             [
//               {
//                 url: tweet_media.media_url_https,
//                 x: 0,
//                 y: 0,
//                 width: tweet_media_w,
//                 height: tweet_media_h,
//               },
//               {
//                 url: "https://cdn.glitch.com/a8e332a3-3d82-4c9d-86c8-4209720f2ca9%2Fb-inverted.png",
//                 x: 0,
//                 y: 0,
//                 width: w,
//                 height: h,
//               },
//             ],
//             w,
//             h,
//             (err, img_data) => {
//               twitter.update_profile_image(img_data, (err) => {
//                 if (!err) {
//                   console.log("updated!");
//                 }
//               });
//             }
//           );
//         });
      },
    },
    {
      description: "dump DB every hour",
      interval: "0 * * * *",
      job: () => {
        let d = new Date(),
          db_dump_filename =
            `db_dump_${helpers.padNumber(d.getFullYear(), 2)}-` +
            `${helpers.padNumber(d.getMonth(), 2)}-` +
            `${helpers.padNumber(d.getDate(), 2)}_` +
            `${helpers.padNumber(d.getHours(), 2)}-` +
            `${helpers.padNumber(d.getMinutes(), 2)}.db`;

        controller.storage.teams.all((err, all_team_data) => {
          fsPath.writeFile(
            `.data/db_dump/${db_dump_filename}`,
            JSON.stringify(all_team_data),
            (err) => {
              console.log(`dumping DB...`);
              if (err) {
                return console.log(err);
              } else {
                console.log(`DB saved to ${db_dump_filename}`);

                fs.readdir(".data/db_dump", (err, files) => {
                  // console.log(files.length, {files})
                  let max_files_count = 80;
                  if (files.length > max_files_count) {
                    let old_files = files.slice(
                      0,
                      files.length - max_files_count
                    );
                    // console.log({old_files})
                    old_files.forEach((file) => {
                      fs.unlink(`.data/db_dump/${file}`);
                    });
                  }
                });
              }
            }
          );
        });
      },
    },
  ];
};
