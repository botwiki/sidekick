/* TODO: This could be broken up into helpers.js and helpers-slack.js, etc. */

const fs = require("fs"),
  qs = require("qs"),
  path = require("path"),
  request = require("request"),
  moment = require("moment"),
  channel_ids = require(__dirname + "/channel_ids.js");

module.exports = {
  parse_channel_ids: (str) => {
    let patt = new RegExp(/(?:<#).*?(?:>)/gi),
      channelIDsParsed = [],
      match;

    while ((match = patt.exec(str)) != null) {
      channelIDsParsed.push(match[0].replace(/<#|>/g, "").split("|")[0]);
    }

    return channelIDsParsed;
  },
  parse_slash_command: (message) => {
    let message_text_arr = message.text.split(" ");
    return {
      command: message_text_arr[0],
      args: message_text_arr.slice(1),
    };
  },
  random_from_array: (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  get_random_int: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  get_random_range: (min, max, fixed) => {
    return (Math.random() * (max - min) + min).toFixed(fixed) * 1;
  },
  number_with_commas: (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  padNumber: (number, length) => {
    let str = "" + number;
    while (str.length < length) {
      str = "0" + str;
    }
    return str;
  },
  get_path_from_url: (url) => {
    return url.split(/[?#]/)[0];
  },
  get_random_hex: () => {
    return "#" + Math.random().toString(16).slice(2, 8).toUpperCase();
  },
  shade_color: (color, percent) => {
    // https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    let f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff;
    return `#${(
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)}`;
  },
  download_file: (options, filename, cb) => {
    request(options).pipe(fs.createWriteStream(filename)).on("close", cb);
    // request.head(options, (err, res, body)=>{
    //   let r = request(options).pipe(fs.createWriteStream(filename)).on('close', cb);
    // });
  },
  check_domain_blacklist: (url) => {
    return (
      [
        // TODO: Temporary solution, move to a separate file
        "twitch.tv",
        "howwegettonext.com",
        "dragplus.com",
        "adf.ly",
        "linkis.com",
      ].indexOf(url) > -1
    );
  },
  is_admin: (bot, message, cb) => {
    let helpers = this;
    bot.api.users.info({ user: message.user }, (err, res) => {
      if (err) {
        console.log({ err });
        if (err === "not_admin") {
          cb({
            error: "not_admin",
            error_message: "Only admins can do that, sorry!",
          });
        } else {
          helpers.notify(bot, message, "Error!", err);
        }
        console.log("err\n", err);
      } else if (res.user.is_admin) {
        cb(null);
      } else {
        cb({
          error: "not_admin",
          error_message: "Only admins can do that, sorry!",
        });
      }
    });
  },
  log_event: (bot, log_text, attachments) => {
    bot.api.chat.postMessage(
      {
        channel: channel_ids.logs,
        text: log_text,
        attachments: JSON.stringify(attachments),
      },
      (err, res) => {
        if (err) {
          console.log(err);
        }
      }
    );
  },
  update_last_active_time: (controller, bot, user_id, active_time, cb) => {
    controller.storage.users.get(user_id, (err, data) => {
      //      console.log(`loading user data for ${user_id}...`, {err}, {data});

      if (err || !data) {
        let data = {
          id: user_id,
        };
      }

      if (active_time === "now") {
        data.last_active = moment().format();
      } else {
        data.last_active = active_time;
      }
      //      console.log(`loaded data for user ${user_id}...`, {data});

      controller.storage.users.save(data, (err, data) => {
        // console.log(`saved user ${user_id}`, {err}, {data});

        //         controller.storage.users.get(user_id, (err, data) =>{
        //           console.log(`loading user data for ${user_id} again...`, {err}, {data});
        //         });

        if (cb) {
          cb();
        }
      });
    });
  },
  notify_mods: (bot, message_from, message_body, cb) => {
    let attachments = [],
      attachment = {
        color: "#4A89DC",
        fields: [],
        mrkdwn_in: ["fields"],
      };

    attachment.fields.push({
      value: message_body,
    });
    attachments.push(attachment);

    let msg_text = "";
    if (message_from) {
      msg_text = `A message from <@${message_from}>:`;
    }

    bot.api.chat.postMessage(
      {
        channel: channel_ids.moderators,
        text: msg_text,
        attachments: JSON.stringify(attachments),
      },
      (err, res) => {
        if (err) {
          console.log(err);
          cb(err);
        } else {
          cb(null);
        }
      }
    );
  },
  get_group_info: (bot, message, cb) => {
    let helpers = this;

    /* Get basic info about the group. */
    let original_message = message;
    bot.api.users.list(
      {
        presence: true,
      },
      (message, data) => {
        let all_users = data.members,
          bots = [],
          online_users = [],
          disabled_users = [];

        all_users.forEach((user) => {
          if (!user.deleted && (user.is_bot || user.name === "slackbot")) {
            // console.log(user)
            bots.push(user);
          }
        });

        all_users = data.members.filter((member) => {
          return !member.is_bot && member.name !== "slackbot";
        });

        all_users.forEach((user) => {
          console.log(user.presence);
          if (user.deleted === true) {
            disabled_users.push(user);
          } else if (user.presence === "active") {
            online_users.push(user);
          }
        });

        let attachments = [],
          attachment = {
            // title: 'Botmakers group info',
            color: "#36a64f",
            fields: [],
            // footer: `Also, there are ${bots.length} bots and other integrations, including *@slackbot*.`
          };

        attachment.fields.push({
          title: "Registered members",
          value: `:bar_chart: ${helpers.number_with_commas(all_users.length)}`,
          short: true,
        });

        attachment.fields.push({
          title: "Active",
          value: `:green_heart: ${helpers.number_with_commas(
            all_users.length - disabled_users.length
          )}`,
          short: true,
        });

        attachment.fields.push({
          title: "Deactivated",
          value: `:no_entry: ${helpers.number_with_commas(
            disabled_users.length
          )}`,
          short: true,
        });

        // attachment.fields.push({
        //   title: 'Online right now',
        //   value: `:eyes: ${helpers.number_with_commas(online_users.length)}`,
        //   short: true
        // });

        attachment.fields.push({
          title: "Bots and integrations",
          value: `:robot_face: ${helpers.number_with_commas(bots.length)}`,
          short: true,
        });
        attachments.push(attachment);

        if (original_message && original_message.user) {
          helpers.is_admin(bot, original_message, (err) => {
            if (!err) {
              console.log(
                online_users.map((user) => {
                  return user.id;
                })
              );

              console.log(original_message.user);

              let attachments = [],
                attachment = {
                  color: "#36a64f",
                  fields: [],
                  mrkdwn_in: ["text,fields"],
                };

              online_users.forEach((user) => {
                bots.push(user);
                // console.log(user);
                attachment.fields.push({
                  value: `<@${user.name}>`,
                  __value: `<@${user.profile.display_name || user.name}>`,
                  thumb_url: user.profile.image_192,
                  short: true,
                });
              });

              console.log(attachment);

              attachment.fields = attachment.fields.sort((a, b) => {
                let name_a = a.__value.toLowerCase(),
                  name_b = b.__value.toLowerCase();

                if (name_a < name_b) {
                  return -1;
                }
                if (name_a > name_b) {
                  return 1;
                }
                return 0;
              });

              attachments.push(attachment);

              // bot.reply(original_message, {
              //   text: 'Online right now:',
              //     // text: online_users.map((user)=>{
              //     //   return `<@${user.name}>`
              //     // }).join(' ')
              //   attachments: attachments
              // });
            }
          });
        }

        cb(null, attachments);
      }
    );
  },
  get_bot_info: (bot, message, cb) => {
    let helpers = this;
    /* Get basic info about the group. */
    let original_message = message;
    bot.api.users.list(
      {
        presence: true,
      },
      (message, data) => {
        let all_users = data.members,
          bots = [];

        let attachments = [],
          attachment = {
            // title: 'Botmakers group info',
            color: "#36a64f",
            fields: [],
            mrkdwn_in: ["text,fields"],
            // footer: `Also, there are ${bots.length} bots and other integrations, including *@slackbot*.`
          };

        all_users.forEach((user) => {
          if (!user.deleted && (user.is_bot || user.name === "slackbot")) {
            // console.log(user);
            bots.push(user);

            attachment.fields.push({
              // title: `:robot_face: @${user.name}`,
              value: `:robot_face: <@${user.name}>`,
              thumb_url: user.profile.image_192,
              short: true,
            });
          }
        });

        attachment.pretext = `There are ${helpers.number_with_commas(
          bots.length
        )} bots in this group. <https://github.com/botwiki/botmakers.org/blob/master/BOTS.md|Learn more.>`;

        attachments.push(attachment);
        cb(null, attachments);
      }
    );
  },
  cleanup: (controller, confirm_delete) => {
    let helpers = this,
      prevent_user_delete_list = process.env.PREVENT_USER_DELETE.split(",");

    console.log(prevent_user_delete_list);

    controller.storage.teams.all((err, all_team_data) => {
      let bot = controller.spawn({ token: all_team_data[0].token });

      bot.api.users.list(
        {
          presence: true,
        },
        (message, data) => {
          if (data && data.members) {
            let all_users = data.members;

            let index = 0;

            all_users.forEach((user, user_index) => {
              if (!user.deleted && !user.is_bot && user.name !== "slackbot") {
                let user_name = "",
                  user_name_original;

                if (user.name) {
                  user_name = user.name;
                  user_name_original = user_name;
                }
                if (user.profile && user.profile.display_name) {
                  if (user_name.length === 0) {
                    user_name = user.profile.display_name;
                    user_name_original = user_name;
                  } else {
                    user_name += " (" + user.profile.display_name + ")";
                  }
                }

                controller.storage.users.get(user.id, (err, user_data) => {
                  // if (!user_data){
                  // index++;
                  // console.log(index + ': ' + user_name + ': no login data');
                  // setTimeout(()=>{
                  //   helpers.deactivate(bot, null, user.id, ()=>{

                  //   });
                  // }, index * 2000);
                  // }
                  if (user_data) {
                    // console.log(`${user_index}: processing ${user_name} (${moment().diff( user_data.last_active, 'days')} days ago)...`);

                    // if (!user_data.last_active){
                    //   index++;
                    //   console.log(index + ': ' + user_name + ': no login data');
                    //   setTimeout(()=>{
                    //     helpers.deactivate(bot, null, user.id, ()=>{

                    //     });
                    //   }, index * 2000);
                    // }
                    if (
                      user_data.last_active &&
                      moment().diff(user_data.last_active, "days") > 180
                    ) {
                      console.log(
                        index +
                          ": " +
                          user_name +
                          ": last online: " +
                          moment().diff(user_data.last_active, "days") +
                          " days ago"
                      );
                      if (
                        prevent_user_delete_list.indexOf(user_name_original) >
                        -1
                      ) {
                        console.log(`skipping ${user_name}...`);
                      } else {
                        if (confirm_delete === true) {
                          console.log(`deactivating ${user_name}...`);
                          index++;
                          setTimeout(() => {
                            helpers.deactivate(
                              bot,
                              null,
                              user_data.id,
                              () => {}
                            );
                          }, index * 1000);
                        }
                      }
                    }
                  }
                });
              }
            });
          }
        }
      );
    });
  },
  notify: (bot, message, title, text) => {
    let attachments = [],
      attachment = {
        title: title,
        color: "#ffa700",
        fields: [],
        mrkdwn_in: ["fields"],
      };

    attachment.fields.push({
      value: text,
    });

    attachments.push(attachment);

    bot.api.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      attachments: JSON.stringify(attachments),
    });
  },
  get_filename_from_url: (url) => {
    return url.substring(url.lastIndexOf("/") + 1);
  },
  deactivate: (bot, message, user_id, cb) => {
    let helpers = this;
    console.log(`Deleting user <@${user_id}>...`);
    // return false;
    let options = {
      token: process.env.superToken,
      user: user_id,
    };

    let url = `https://slack.com/api/users.admin.setInactive?${qs.stringify(
      options
    )}`;

    let r = request.get(url, (err, resp, body) => {
      console.log("users.admin.setInactive", body);
      if (err) {
        console.log("users.admin.setInactive ERROR", err);
      } else {
        console.log(`User <@${user_id}> was removed.`);
        // helpers.notify_mods(bot, null, `User <@${user_id}> was removed.`, (err, data){})=>;
        if (cb) {
          cb();
        }
      }
    });
  },
};
