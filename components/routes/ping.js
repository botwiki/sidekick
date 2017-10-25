/*
  It's okay to ping an app on Glitch "every five minutes, or so".
  Source: https://support.glitch.com/t/not-letting-the-app-go-down/2000/2
*/

module.exports = function(webserver, controller) {
  webserver.get('/ping', function(req, res) {
    console.log('pong')
    res.json({
      ping: 'pong'
    });      
  });
}
