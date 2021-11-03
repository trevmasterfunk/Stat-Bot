const fs = require('fs')
const { MessageEmbed } = require('discord.js')
const lib = require('../lib.js')

module.exports = {
    name: 'coinflip',
    description: "This command flips a coin costing 1 minute. You must call the flip. If you get it correct then you get back two minutes. Syntax: '-coinflip heads'",
    async execute(message, args, client) {
        //get store data
        let storepath = "./data/store.json"
        let store = JSON.parse(fs.readFileSync(storepath, 'utf8'))
        //get cost and effect from store json data
        let cost = (store.games["Coinflip"].cost * 60000) * -1 //cost * conversion to miliseconds
        let effect = store.games["Coinflip"].effect * 60000 //effect * conversion to miliseconds

        // get user data
        let data = globaluserdata
        //customerdata
        let customerid = message.author.id


        //stops reference error if user is not in data.json
        if (!data.users[customerid]) {
            message.channel.send("You have not yet logged time in statbot. Join a channel then leave or wait 5 minutes to be entered into the log.")
            return
        }

        //create message
        const embeddedmsg = new MessageEmbed()
            .setTitle('Results - ' + message.author.username)

        //initialize reply
        let reply = "Something went wrong."

        //player did not call coinflip. tell them and exit
        if (!args[0]) {
            reply = "You must call it"
            embeddedmsg.setDescription(reply)
            message.channel.send({ embed: embeddedmsg })
            return
        }

        //set and check cooldown
        let now = new Date()
        let then = -999999999999999
        if (!data.users[customerid].cooldowns['Coinflip']) {
            data.users[customerid].cooldowns['Coinflip'] = now
        } else {
            then = new Date(data.users[customerid].cooldowns['Coinflip'])
        }
        if ((now - then) < store.games['Coinflip'].cooldown && then != now) {
            reply = 'Coinflip' + " is on cooldown for you. Try again in " + Math.round(((store.games['Coinflip'].cooldown - (now - then)) / 1000)) + " seconds."
            embeddedmsg.setDescription(reply)
            message.channel.send({ embed: embeddedmsg })
            return
        }
        data.users[customerid].cooldowns['Coinflip'] = now

        //flip coin
        let coin = (Math.floor(Math.random() * 2) == 0)
        if (coin) { coin = "heads" } else { coin = "tails" }

        //determine if they won or not
        if (args[0].toLowerCase() == coin) {
            reply = "Congratulations! You were right!"
            data.users[customerid].deductions = data.users[customerid].deductions + cost + effect
        } else {
            reply = "Oops! Better luck next time"
            data.users[customerid].deductions = data.users[customerid].deductions + cost
        }

        //save data
        globaluserdata = data

        //send message
        embeddedmsg.setDescription(reply)
        message.channel.send({ embed: embeddedmsg })
    }
}