const fs = require("fs"),
  Canvas = require("canvas"),
  path = require("path"),
  helpers = require(__dirname + "/../helpers.js");

module.exports = {
  overlay_images: (overlays, width, height, cb) => {
    console.log("overlaying images...");

    let prepareImgFn = function prepare_image(overlay, index) {
      // console.log(`preparing (${index})...\n`, overlay);
      return new Promise((resolve) => {
        if (overlay.url) {
          let imgPath = path.join(
            __dirname,
            "..",
            helpers.get_filename_from_url(overlay.url)
          );
          // console.log({imgPath});
          helpers.download_file(overlay.url, imgPath, () => {
            // console.log(`downloading to ${imgPath}...`);

            fs.readFile(imgPath, function (err, buffer) {
              if (err) {
                console.log({ err });
                return false;
              }
              // console.log('image downloaded...');
              overlay.buffer = buffer;
              return resolve(overlay, index);
            });
          });
        } else if (overlay.text) {
          return resolve(overlay, index);
        }
      });
    };

    const make_overlay_image = (data) => {
      // console.log({data});
      let canvas = new Canvas(width, height),
        ctx = canvas.getContext("2d"),
        Image = Canvas.Image;

      data.forEach((img) => {
        if (img.text) {
          // console.log('overlaying text...');
          ctx.font = `${img.fontSize}px ${img.fontFamily}`;
          ctx.fillStyle = img.style;

          if (img.position) {
            // console.log(`positioning text: ${img.position} ...`);

            let textWidth = ctx.measureText(img.text).width,
              textHeight = img.fontSize;

            if (img.position === "top left") {
              ctx.fillText(img.text, 0, textHeight);
            } else if (img.position === "top center") {
              ctx.fillText(
                img.text,
                canvas.width / 2 - textWidth / 2,
                textHeight
              );
            } else if (img.position === "top right") {
              ctx.fillText(img.text, canvas.width - textWidth, textHeight);
            } else if (img.position === "center left") {
              ctx.fillText(img.text, 0, canvas.height / 2 - textHeight);
            } else if (img.position === "center center") {
              ctx.fillText(
                img.text,
                canvas.width / 2 - textWidth / 2,
                canvas.height / 2 + textHeight / 2
              );
            } else if (img.position === "center right") {
              ctx.fillText(
                img.text,
                canvas.width - textWidth,
                canvas.height / 2 + textHeight / 2
              );
            } else if (img.position === "bottom left") {
              ctx.fillText(img.text, 0, canvas.height);
            } else if (img.position === "bottom center") {
              ctx.fillText(
                img.text,
                canvas.width / 2 - textWidth / 2,
                canvas.height - 1.5 * img.fontSize
              );
            } else if (img.position === "bottom right") {
              ctx.fillText(img.text, canvas.width - textWidth, canvas.height);
            }
          } else if (img.x && img.y) {
            ctx.fillText(img.text, img.x, img.y);
          }
        } else {
          let overlay = new Image();
          overlay.src = img.buffer;

          // console.log('overlaying image...');
          // ctx.globalCompositeOperation = 'multiply';
          // ctx.drawImage(overlay, img.x, img.y, img.width, img.height, 0, 0, canvas.width, canvas.height);
          ctx.drawImage(overlay, img.x, img.y, img.width, img.height);
          fs.unlink(helpers.get_filename_from_url(img.url), (err) => {
            if (!err) {
              console.log("local image deleted...");
            }
          });
        }
      });
      cb(null, canvas.toBuffer().toString("base64"));
    };

    let actions = overlays.map(prepareImgFn);
    let results = Promise.all(actions);

    results.then(function (img_data_arr, index) {
      return make_overlay_image(img_data_arr);
    });
  },
};
