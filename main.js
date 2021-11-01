require("dotenv").config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const lib = require('./lib.js')

let prefix = '-';  //prefix that must be first in message to get bot to issue commands

global.tempdata = { users: {} }  //object that contains all users currently connected to a voice channel, which channel it is, and their join time

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
};

let updatedatainterval  //will be interval that calls the updatedata function. this function saves all current data in the tempdata to the data json file

client.on('ready', () => {  //runs when bot first starts
    console.log('Logged in as ' + client.user.tag);
    lib.tempdatainit(client) //initialize the tempdata object
    updatedatainterval = setInterval(lib.updatedata, 300000); //runs updatedata every 5 minutes
});

client.on('message', message => {  //runs when bot sees a new message
    let banlist = "./data/banned.json"
    let banned = JSON.parse(fs.readFileSync(banlist, 'utf8'))
    banned = banned.users
    if (!message.content.startsWith(prefix) || message.author.bot) return;  //message has to have prefix and not be a bot
    if (banned[message.author.id]) {
        message.channel.send("You cant use this bots commands. You are also not tracked by this bot. Reason: " + banned[message.author.id].Reason)  //reply to banned user trying to use bot
        return
    }
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

client.on('voiceStateUpdate', async (oldState, newState) => { //called any time anything in a voice channel changes such as user mute, user deafened, channel change
    lib.checkstates(oldState, newState)
})

client.login(process.env.BOTTOKEN);