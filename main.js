require("dotenv").config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const lib = require('./lib.js')

let prefix = '-';

global.tempdata = { users: {} }

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
};

client.on('ready', () => {
    console.log('Logged in as ' + client.user.tag);
    lib.tempdatainit(client)
});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase()
    if (command === 'ping') {
        client.commands.get(command).execute(message, args)
    } else if (command === "wallet") {
        client.commands.get("wallet").execute(message, args)
    } else if (command === "ranks") {
        client.commands.get("ranks").execute(message, args)
    } else if (command === "store") {
        client.commands.get("store").execute(message, args)
    } else if (command === "buy") {
        client.commands.get("buy").execute(message, args, client)
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    lib.checkstates(oldState, newState)
})

client.login(process.env.BOTTOKEN);