require("dotenv").config()
const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs')
const lib = require('./lib.js')
const keepAlive = require('./server')

let prefix = '-'  //prefix that must be first in message to get bot to issue commands

global.tempdata = { users: {} }  //object that contains all users currently connected to a voice channel, which channel it is, and their join time
global.globaluserdata = JSON.parse(fs.readFileSync("./data/data.json", 'utf8'))
global.busy = false
global.shutuplist = []

global.spamMap = new Map()
global.mutelist = new Map()
global.games = new Map()

client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
}

let updatedatainterval  //will be interval that calls the updatedata function. this function saves all current data in the tempdata to the data json file

client.on('ready', () => {  //runs when bot first starts
    console.log('Logged in as ' + client.user.tag)
    lib.tempdatainit(client) //initialize the tempdata object
    updatedatainterval = setInterval(lib.updatedata, 120000) //runs updatedata every 5 minutes
})

client.on('message', message => {  //runs when bot sees a new message
    if (busy) { return }
    let banned = globaluserdata.banned

    if (!message.content.startsWith(prefix) || message.author.bot || mutelist.has(message.author.id)) return  //message has to have prefix and not be a bo

    lib.antispam(message, 3, 5, 3000, 5000, 60000) //parameters: message; number of messages to trigger warning; number of messages to trigger ignore; time between messages; time until person is cleared from spamchecklist; time ignored

    if (banned[message.author.id]) {
        message.channel.send("You cant use this bots commands. You are also not tracked by this bot. Reason: " + banned[message.author.id].Reason)  //reply to banned user trying to use bot
        return
    }
    const args = message.content.slice(prefix.length).split(/ +/)
    const command = args.shift().toLowerCase()
    if (command === 'ping') {
        client.commands.get(command).execute(message, args)
    } else if (command === "help") {
        client.commands.get("help").execute(message, args, client)
    } else if (command === "wallet") {
        client.commands.get("wallet").execute(message, args)
    } else if (command === "ranks") {
        client.commands.get("ranks").execute(message, args)
    } else if (command === "store") {
        client.commands.get("store").execute(message, args)
    } else if (command === "buy") {
        client.commands.get("buy").execute(message, args, client)
    } else if (command === "coinflip") {
        client.commands.get("coinflip").execute(message, args, client)
    } else if (command === "slots") {
        client.commands.get("slots").execute(message, args, client)
    } else if (command === "gift") {
        client.commands.get("gift").execute(message, args, client)
    } else if (command === "admin" && message.author.id == "353267226733838349") {
        if (args[0] == 'shutdown') {
            lib.shutdown(client)
        } else if (args[0] == 'cleanslate') {
            lib.cleanslate()
        }
    } else if (command === "w") {
        client.commands.get("w").execute(message, args)
    } else if (command === "deathroll") {
        client.commands.get("deathroll").execute(message, args)
    } else if (command === "roll") {
        client.commands.get("roll").execute(message, args)
    }
})



client.on('voiceStateUpdate', async (oldState, newState) => { //called any time anything in a voice channel changes such as user mute, user deafened, channel change
    lib.checkstates(oldState, newState, client)
})

keepAlive()
client.login(process.env.BOTTOKEN)