const { MessageEmbed } = require('discord.js')
const lib = require('../lib.js')

module.exports = {
    name: 'gift',
    description: "This command will allow you to gift minutes to others.",
    async execute(message, args, client) {

        //check to see if more than one user is mentioned
        if (message.mentions.users.size > 1) {
            message.channel.send('Invalid input.')
            return
        } else if (args[1] == null) {
            message.reply('Invalid Input')
            return
        } else if (isNaN(parseInt(args[1], 10))) {
            message.reply('Invalid Input')
            return
        }

        let reply = gift(message, args)

        const embeddedmsg = new MessageEmbed()
            .setTitle('Gift Receipt')
        embeddedmsg.setDescription(reply)

        message.channel.send({ embed: embeddedmsg })
    }
}

function gift(msg, arguments) {

    let customer = msg.author.id
    let victim = msg.mentions.users.entries().next().value
    let victimid = victim[0]
    victim = victim[1]
    let gift = (parseInt(arguments[1], 10)) * 60000

    let userdata = globaluserdata
    let reply

    //checks to see if user has enough to gift
    if (lib.gettotaltime(customer, userdata) <= gift) {
        reply = "Card declined! Bank says you poor."
        return reply
    } else if (gift < 0) {
        userdata.users[customer].deductions = userdata.users[customer].deductions - (60 * 60000)
        reply = "One hour has been removed from your account. Thanks for your support!"
        return reply
    }

    //currency exchange
    userdata.users[customer].deductions = userdata.users[customer].deductions - gift
    userdata.users[victimid].deductions = userdata.users[victimid].deductions + gift

    reply = msg.author.username + " gifted " + victim.username + " " + (gift / 60000)
    return reply
}