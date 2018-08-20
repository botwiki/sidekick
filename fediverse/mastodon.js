var fs = require('fs'),
    Mastodon = require('mastodon'),
    M;

try {
  M = new Mastodon({
    'access_token': process.env.MASTODON_ACCESS_TOKEN,
    'api_url': process.env.MASTODON_API || 'https://mastodon.social/api/v1/'
  });
  console.log('ready to toot!');
} catch(err) {
  console.error(err);
  console.error('please update your .env file')
}

module.exports = {
  M: M,
  toot: function(status, cb){
    if (!M){
      console.error('please update your .env file')
      return false;
    }
    if (status.length > 500){
      console.error(`status too long: ${status}`);
      return false;
    }

    console.log('tooting!');
    M.post('statuses', { status: status }, function(err, data, response) {
      console.log(`posted status: ${status}`);
    });
    
    if (cb){
      cb(null);
    }
  },
  post_image: function(text, img_file, cb) {

   M.post('media', { 
     file: fs.createReadStream(`${__dirname}/../${img_file}`)
   }, function (err, data, response) {
      if (err){
        console.log('ERROR:\n', err);
        if (cb){
          cb(err);
        }
      }
      else{
        // console.log(data);
        console.log('tooting the image...');
        M.post('statuses', {
          status: text,
          // media_ids: new Array(data.media_id_string)
          media_ids: new Array(data.id)
        },
        function(err, data, response) {
          if (err){
            console.log('ERROR:\n', err);
            if (cb){
              cb(err);
            }
          }
          else{
            console.log('tooted!');
            if (cb){
              cb(null);
            }
          }
        });
      }
    });
  }  
}


