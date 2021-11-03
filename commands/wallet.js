const fs = require('fs')
const lib = require('./../lib.js')
const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'wallet',
    description: "This command will display your current net worth as well as your channel stat totals.",
    execute(message, args, client) {

        let data = globaluserdata
        let userid = message.author.id
        let _userdata
        if (!data.users[userid]) {
            message.channel.send("You're broke, bitch.")
            return
        } else {
            _userdata = data.users[userid]
        }

        let total = numberWithCommas(Math.round(lib.gettotaltime(userid, data) / (1000 * 60)))
        let totals = {}

        for (const chan in _userdata.channels) {
            let channel = _userdata.channels[chan]
            let name = channel.name
            let time = Math.round(channel.time / (1000 * 60))
            if (time > 0) {
                totals[name] = {
                    channel: name,
                    time: time
                }
            }
        }
        totals["Deductions"] = {
            channel: "Deductions",
            time: numberWithCommas(Math.round(_userdata.deductions / (1000 * 60)))
        }

        const embeddedmsg = new MessageEmbed()
            .setTitle('Your Wallet')
            .setDescription('Your total time and where you got it. Channel times do not include deductions.')
            .setThumbnail('https://i.imgur.com/kZYnDHt.jpeg')
            .addFields({ name: 'Total', value: total + ' Minutes' })
        for (chan in totals) {
            embeddedmsg.addFields({
                name: totals[chan].channel,
                value: numberWithCommas(totals[chan].time) + ' Minutes'
            })
        }
        message.channel.send({ embed: embeddedmsg })

    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}