const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ranks',
    description: "This command will show you the current ranking of users in this discord acording to net worth. If 'stats' is added to the end of 'ranks' this command will display the earnings, not net worth.",
    execute(message, args, client) {
        let jsonpath = "./data/data.json"
        let data = JSON.parse(fs.readFileSync(jsonpath, 'utf8'))
        let userdata// = data.users[userid]
        let totals = {}
        let embeddesc
        if (args[0] == "stats") {
            embeddesc = "Forbes evaluation of users earnings in this scord"
            for (const userid in data.users) {
                userdata = data.users[userid]
                let totaltime = 0
                for (const chan in userdata.channels) {
                    let time = Math.round(userdata.channels[chan].time / (1000 * 60))
                    totaltime = totaltime + time
                }
                totals[userdata.nick] = totaltime
            }
        } else {
            embeddesc = "Forbes evaluation of users net worth in this scord"
            for (const userid in data.users) {
                userdata = data.users[userid]
                totals[userdata.nick] = Math.round(userdata.total / (1000 * 60))
            }
        }


        let sortedtotals = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a] })

        const embeddedmessage = new MessageEmbed()
            .setTitle('Forbes Rankings')
            .setDescription(embeddesc)
            .setThumbnail('https://fontslogo.com/wp-content/uploads/2013/03/Forbes-Magazine-Logo-Font.jpg')
            .setTimestamp()

        let i = 1
        for (person in sortedtotals) {
            let username = "#" + i + " " + sortedtotals[person]
            let timeval = totals[sortedtotals[person]]
            embeddedmessage.addFields(
                {
                    name: username,
                    value: timeval + " Minutes"
                }
            )
            i += 1
        }

        message.channel.send({ embed: embeddedmessage })
    }
}