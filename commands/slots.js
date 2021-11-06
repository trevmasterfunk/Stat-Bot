const fs = require('fs')
const { MessageEmbed } = require('discord.js')
const lib = require('../lib.js')

module.exports = {
    name: 'slots',
    description: "This command plays the slots. You can enter the ammount you'd like to bet at the end of the command ie. '-slots 60'. If you get two of the same emote in a row you win 5X bet. If you get three of the same emote you get 10X bet. Jackpot is 100X bet. Syntax: '-slots 10'",
    async execute(message, args, client) {
        //get store data
        let storepath = "./data/store.json"
        let store = JSON.parse(fs.readFileSync(storepath, 'utf8'))

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
            .setTitle('Slot Results - ' + message.author.username)

        //initialize reply
        let reply = "Something went wrong."

        let wager = 10
        //player did not call coinflip. tell them and exit
        if (args[0]) {
            if (args[0] < 5) {
                reply = "Wager must be at least 5 minutes"
                embeddedmsg.setDescription(reply)
                message.channel.send({ embed: embeddedmsg })
                return
            } else {
                wager = parseInt(args[0], 10)
                if (wager < 5) {
                    reply = "Wager must be at least 5 minutes"
                    embeddedmsg.setDescription(reply)
                    message.channel.send({ embed: embeddedmsg })
                    return
                }
            }
        }

        //checks to make sure user can afford wager
        let usertotaltime = lib.gettotaltime(customerid, data)
        let wagertemp = wager * 60000
        if (usertotaltime <= wagertemp) {
            reply = "Not enough money. You can thank TR!"
            embeddedmsg.setDescription(reply)
            message.channel.send({ embed: embeddedmsg })
            return
        }
        if (isNaN(wager)) {
            reply = "Incorrect entry!"
            embeddedmsg.setDescription(reply)
            message.channel.send({ embed: embeddedmsg })
            return
        }

        //set and check cooldown
        let now = new Date()
        let then = -999999999999999
        if (!data.users[customerid].cooldowns['Slots']) {
            data.users[customerid].cooldowns['Slots'] = now
        } else {
            then = new Date(data.users[customerid].cooldowns['Slots'])
        }
        if ((now - then) < store.games['Slots'].cooldown && then != now) {
            reply = "Slots is on cooldown for you. Try again in " + Math.round(((store.games['Slots'].cooldown - (now - then)) / 1000)) + " seconds."
            embeddedmsg.setDescription(reply)
            message.channel.send({ embed: embeddedmsg })
            return
        }
        data.users[customerid].cooldowns['Slots'] = now



        // get choices from store.json
        const choices = store.games["Slots"].emotes
        const numchoices = Object.keys(choices).length - 1

        //generate random rolls
        let rand = []
        rand.push(getrandom(numchoices))
        rand.push(getrandom(numchoices))
        rand.push(getrandom(numchoices))

        //generate emotes message
        let slotmachineresults = ""
        for (i = 1; i < 4; i++) {
            let line = ""
            if (i == 1) {
                //get first row
                let s1i = rand[0] - 1
                if (s1i < 0) { s1i = numchoices }
                let s2i = rand[1] - 1
                if (s2i < 0) { s2i = numchoices }
                let s3i = rand[2] - 1
                if (s3i < 0) { s3i = numchoices }
                let e1 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s1i])
                let e2 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s2i])
                let e3 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s3i])
                line = `${e1}` + `${e2}` + `${e3}` + "\n"
            } else if (i == 2) {
                //middle row
                let s1i = rand[0]
                let s2i = rand[1]
                let s3i = rand[2]
                let e1 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s1i])
                let e2 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s2i])
                let e3 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s3i])
                line = `${e1}` + `${e2}` + `${e3}` + "\n"
            } else {
                //last row
                let s1i = rand[0] + 1
                if (s1i > numchoices) { s1i = 0 }
                let s2i = rand[1] + 1
                if (s2i > numchoices) { s2i = 0 }
                let s3i = rand[2] + 1
                if (s3i > numchoices) { s3i = 0 }
                let e1 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s1i])
                let e2 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s2i])
                let e3 = await message.guild.emojis.cache.find(emoji => emoji.name == choices[s3i])
                line = `${e1}` + `${e2}` + `${e3}`
            }
            slotmachineresults = slotmachineresults + line
        }

        //generate rest of response
        let jackpot = store.games["Slots"].jackpot
        let Payout = 0
        let payoutresponse = "   No matches. Try again! Maybe if you bet more you'll win big :)"
        let middle = rand[1]
        if (choices[rand[0]] == jackpot && choices[rand[1]] == jackpot && choices[rand[2]] == jackpot) {
            Payout = wager * 100
            payoutresponse = "   JACKPOT!!!!!!!!! DING DING DING"
        } else if (rand[0] == rand[1] && rand[0] == rand[2]) {
            Payout = wager * 10
            payoutresponse = "   Hot damn! Three in a row!"
        } else if (rand[0] == rand[1] || rand[1] == rand[2]) {
            Payout = wager * 5
            payoutresponse = "  Ooo so close! Two in a row!"
        } else if ((rand[0] == (middle - 1) && rand[2] == (middle + 1)) || rand[2] == (middle - 1) && rand[0] == (middle + 1)) {
            Payout = wager * 3
            payoutresponse = "  You hit a diagonal"
        }

        Payout = Payout * 60000
        wager = wager * 60000

        data.users[customerid].deductions = data.users[customerid].deductions + Payout - wager

        //combine message into embed
        embeddedmsg.setDescription(slotmachineresults)
        embeddedmsg.addFields(
            { name: 'Wager', value: wager, inline: true },
            { name: 'Payout', value: Payout, inline: true },
            { name: "Response", value: payoutresponse, inline: false },
            { name: "New Balance", value: Math.floor((lib.gettotaltime(customerid, data) / 60000)), inline: false }
        )

        // //save data
        globaluserdata = data

        message.channel.send({ embed: embeddedmsg })
    }
}

function getrandom(max) {
    return Math.floor(Math.random() * max)
}