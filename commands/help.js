const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    description: "This command lists all commands",
    execute(message, args, client) {
        let commands = client.commands
        const embeddedmsg = new MessageEmbed()
            .setTitle('Commands')
            .setThumbnail('https://holaquepasa.com/wp-content/uploads/2019/01/Affirmative-Informal-Commands-in-Spanish-Learn-and-Practice-1200x1204.jpg')
        for (let command of commands) {
            if (command[1].name !== "help" && command[1].name !== "ping") {
                embeddedmsg.addFields({
                    name: command[1].name,
                    value: command[1].description
                })
            }
        }
        message.channel.send({ embed: embeddedmsg })
    }
}