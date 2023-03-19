console.log('starting slack/discord bridge')
const Discord = require('discord.js');
const { WebClient } = require('@slack/web-api');
const client = new Discord.Client();
const tokens = require('tokens.js');
const token = tokens.bot();
const slackToken = tokens.slack();
const discordGuildId = tokens.guild();
const channelMapping = require('./channelMapping.json');

const slackWebClient = new WebClient(slackToken);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  const slackChannel = channelMapping[message.channel.name];
  
  if (slackChannel) {
    const slackMessage = `*${message.author.username}:* ${message.content}`;
  
    slackWebClient.chat.postMessage({
      channel: slackChannel,
      text: slackMessage
    });
  }
});

slackWebClient.conversations.list()
  .then(result => {
    result.channels.forEach(channel => {
      slackWebClient.conversations.history({
        channel: channel.id,
        limit: 1
      }).then(result => {
        const messages = result.messages;
        if (messages.length > 0) {
          const ts = messages[0].ts;
          slackWebClient.conversations.history({
            channel: channel.id,
            oldest: ts
          }).then(result => {
            const messages = result.messages;
            messages.reverse().forEach(message => {
              if (message.user === 'YOUR_SLACK_BOT_USER_ID_HERE') return;
              const discordChannelName = channelMapping[channel.name];
              if (discordChannelName) {
                const discordChannel = client.channels.cache.find(ch => ch.name === discordChannelName);
                discordChannel.send(`**${message.user}:** ${message.text}`);
              }
            });
          }).catch(error => {
            console.error(error);
          });
        }
      }).catch(error => {
        console.error(error);
      });
    });
  })
  .catch(error => {
    console.error(error);
  });

client.login(token);
