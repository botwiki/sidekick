var fs = require('fs'),
    Canvas = require('canvas'),
    path = require('path'),
    helpers = require(__dirname + '/../helpers.js');

 module.exports = {
   overlay_images: function(overlays, width, height, cb){
    console.log('overlaying images...');
    
    var prepareImgFn = function prepare_image(overlay, index){
      // console.log(`preparing (${index})...\n`, overlay);
      return new Promise(function(resolve){
        if (overlay.url){
          var img_path = path.join(__dirname, '..', helpers.get_filename_from_url(overlay.url));
          // console.log({img_path});
          helpers.download_file(overlay.url, img_path , function(){
            // console.log(`downloading to ${img_path}...`);

            fs.readFile(img_path, function ( err, buffer ) {
              if (err) {
                console.log({err});
                return false;
              }
              // console.log('image downloaded...');
              overlay.buffer = buffer;
              return resolve(overlay, index);
            });
          });
        }
        else if(overlay.text){
          return resolve(overlay, index);          
        }
      });
    }

    function make_overlay_image(data){
      // console.log({data});
      var canvas = new Canvas(width, height),
        ctx = canvas.getContext("2d"),
        Image = Canvas.Image;
      
      data.forEach(function(img){
        if (img.text){
          // console.log('overlaying text...');
          ctx.font = `${img.fontSize}px ${img.fontFamily}`;
          ctx.fillStyle = img.style;

          if (img.position){
            // console.log(`positioning text: ${img.position} ...`);
            
            var textWidth = ctx.measureText(img.text).width,
                textHeight = img.fontSize;

            if (img.position === 'top left'){
              ctx.fillText(img.text, 0, textHeight);
            }
            else if (img.position === 'top center'){
              ctx.fillText(img.text, (canvas.width/2) - (textWidth / 2), textHeight);
            }
            else if (img.position === 'top right'){
              ctx.fillText(img.text, canvas.width - textWidth, textHeight);
            }
            else if (img.position === 'center left'){
              ctx.fillText(img.text, 0, (canvas.height/2) - textHeight);
            }
            else if (img.position === 'center center'){
              ctx.fillText(img.text, (canvas.width/2) - (textWidth / 2), (canvas.height/2) + textHeight/2);
            }
            else if (img.position === 'center right'){
              ctx.fillText(img.text, canvas.width - textWidth, (canvas.height/2) + textHeight/2);
            }
            else if (img.position === 'bottom left'){
              ctx.fillText(img.text, 0, canvas.height);
            }
            else if (img.position === 'bottom center'){
              ctx.fillText(img.text, (canvas.width/2) - (textWidth / 2), canvas.height - 1.5 * img.fontSize);
            }
            else if (img.position === 'bottom right'){
              ctx.fillText(img.text, canvas.width - textWidth, canvas.height);
            }              
          }else if (img.x && img.y){
            ctx.fillText(img.text, img.x, img.y);          
          }
        }
        else{
          var overlay = new Image;
              overlay.src = img.buffer;

          // console.log('overlaying image...');
          // ctx.globalCompositeOperation = 'multiply';                  
          // ctx.drawImage(overlay, img.x, img.y, img.width, img.height, 0, 0, canvas.width, canvas.height);
          ctx.drawImage(overlay, img.x, img.y, img.width, img.height);
          fs.unlink(helpers.get_filename_from_url(img.url), function(err){ 
            if (!err){
              console.log('local image deleted...');
            }
          });          
        }
      });
      cb(null, canvas.toBuffer().toString('base64'));
    }

    var actions = overlays.map(prepareImgFn);
    var results = Promise.all(actions);  

    results.then(function (img_data_arr, index) {
      return (
        make_overlay_image(img_data_arr)
      );
    });
  }
}