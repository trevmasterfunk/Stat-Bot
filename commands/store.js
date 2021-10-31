const fs = require('fs');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'store',
    description: "This command will list the items avaiable in the store.",
    execute(message, args, client) {
        let jsonpath = "./data/store.json"
        let data = JSON.parse(fs.readFileSync(jsonpath, 'utf8'))

        const embeddedmsg = new MessageEmbed()
            .setTitle('Store')
            .setDescription('Khajiit has wares, if you have coin')
            .setThumbnail('https://i.kym-cdn.com/photos/images/newsfeed/001/062/258/14d.jpg')

        for (const item in data.stock) {
            embeddedmsg.addFields({
                name: item + " --- Cost: " + data.stock[item].costdesc,
                value: ">>> " + data.stock[item].description
            })
        }
        message.channel.send({ embed: embeddedmsg })
    }
}