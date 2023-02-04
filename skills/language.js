/*********************************************************************************
COC reminders.

botwiki.org/coc

*********************************************************************************/

const wordfilter = require('wordfilter');

module.exports = (controller) => {
  /* Remind folks using "guys" about gender-neutral alternatives. */
  controller.hears([
    'guys'
  ], 'mention,direct_message,direct_mention,ambient', (bot, message) => {
      if (!wordfilter.blacklisted(message.match[1])) {
        bot.api.chat.postEphemeral({
          channel:message.channel,
          user: message.user,
          text: 'Quick reminder: If you\'re addressing a group of people, ' + 
                'please try using _Hi everyone_, or _Hey folks_. ' +
                '<https://botwiki.org/coc/#language-and-communication|See why.>'
        });
      } else {
        bot.replyPrivate(message, 'Watch your language!');     
      }
  });
  
  /* Try to catch ableist language. */
  controller.hears([
    'crazy', 'retarded', 'nuts', 'idiot', 'dumb', 'insane', 'lame'
  ], 'mention,direct_message,direct_mention,ambient', (bot, message) => {
      if (!wordfilter.blacklisted(message.match[1])) {
        
        bot.api.chat.postEphemeral({
          channel:message.channel,
          user: message.user,
          text: 'Did you mean _bad_, _horrible_, _boring_, _confusing_, ' +
                '_ridiculous_, _nonsense_, _unwise_, _intense_, or _wild_? ' +
                '<https://botwiki.org/coc/#language-and-communication|Learn more.>'
        });
      } else {
        bot.api.chat.postEphemeral({
          channel:message.channel,
          user: message.user,
          text: 'Watch your language!'
        });
      }
  });  
}


