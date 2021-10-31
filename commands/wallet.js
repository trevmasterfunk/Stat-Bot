const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'wallet',
    description: "This command will display your current net worth as well as your channel stat totals.",
    execute(message, args, client) {
        let jsonpath = "./data/data.json"
        let data = JSON.parse(fs.readFileSync(jsonpath, 'utf8'))
        let userid = message.author.id
        let userdata
        if (!data.users[userid]) {
            message.channel.send("You're broke, bitch.")
            return
        } else {
            userdata = data.users[userid]
        }

        let total = numberWithCommas(Math.round(userdata.total / (1000 * 60)))
        let totals = {}

        for (const chan in userdata.channels) {
            let channel = userdata.channels[chan]
            let name = channel.name
            let time = Math.round(channel.time / (1000 * 60))
            if (time > 0) {
                totals[name] = {
                    channel: name,
                    time: time
                }
            }
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
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}