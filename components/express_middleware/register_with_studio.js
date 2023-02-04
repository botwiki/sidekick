const request = require("request");
const debug = require("debug")("botkit:register_with_studio");
module.exports = (webserver, controller) => {
  let registered_this_session = false;

  controller.registerDeployWithStudio = (host) => {
    if (!registered_this_session && controller.config.studio_token) {
      // information about this instance of Botkit
      // send to Botkit Studio in order to display in the hosting tab
      let instance = {
        url: host,
        version: controller.version(),
        ts: new Date(),
      };

      request(
        {
          method: "post",
          uri:
            (controller.config.studio_command_uri ||
              "https://studio.botkit.ai") +
            "/api/v1/bots/phonehome?access_token=" +
            controller.config.studio_token,
          form: instance,
        },
        (err, res, body) => {
          registered_this_session = true;

          if (err) {
            debug("Error registering instance with Botkit Studio", err);
          } else {
            let json = null;
            try {
              json = JSON.parse(body);
            } catch (err) {
              debug("Error registering instance with Botkit Studio", err);
            }

            if (json) {
              if (json.error) {
                debug(
                  "Error registering instance with Botkit Studio",
                  json.error
                );
              }
            }
          }
        }
      );
    }
  };

  if (webserver && controller.config.studio_token) {
    webserver.use((req, res, next) => {
      controller.registerDeployWithStudio(req.get("host"));
      next();
    });
  }
};
