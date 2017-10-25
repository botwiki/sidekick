/*********************************************************************************

Keep track of active members.

*********************************************************************************/

module.exports = function(controller) {
  controller.on('presence_change', function(bot, message){
    // TODO: Save date/time for group member. 
  });
}


