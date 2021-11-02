const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const lib = require('./../lib.js');

module.exports = {
    name: 'buy',
    description: "This command will allow you to buy items from the shop.",
    async execute(message, args, client) {
        let storepath = "./data/store.json"
        let data = JSON.parse(fs.readFileSync(storepath, 'utf8'))

        let buyitem
        for (item in data.stock) {
            if (args[0].toLowerCase() == item.toLowerCase()) {
                buyitem = item
            }
        }
        if (!buyitem) {
            message.channel.send("Item not in shop!!!")
            return
        }
        let reply = "Transaction Failed."
        switch (buyitem) {
            case "Blueshell":
                reply = blueshell(message)
                break
            case "Hell":
                reply = await hell(message, client)
                break
        }

        const embeddedmsg = new MessageEmbed()
            .setTitle('Receipt')
        if (reply == "Not enough money for transaction.") {
            embeddedmsg.setDescription(reply)
        } else if (reply == "Transaction Failed.") {
            embeddedmsg.setDescription(reply)
        } else {
            embeddedmsg.setDescription("Your purchase of " + buyitem + " was successful!\n" + reply)
        }


        message.channel.send({ embed: embeddedmsg })
    }
}

function blueshell(msg) {
    let item = "Blueshell"
    let storepath = "./data/store.json"
    let store = JSON.parse(fs.readFileSync(storepath, 'utf8')).stock

    let cost = store[item].cost * 60000 //cost * conversion to miliseconds
    let effect = store[item].effect * 60000 //effect * conversion to miliseconds

    let receipt = "Not enough money for transaction."
    let customerid = msg.author.id

    let datapath = "./data/data.json"
    let userdata = JSON.parse(fs.readFileSync(datapath, 'utf8'))
    if (lib.gettotaltime(customerid, userdata) <= cost) {
        return receipt
    }
    let targetid = ""
    let targettotal = 0
    for (const user in userdata.users) {
        let temptotal = lib.gettotaltime(user, userdata)
        if (temptotal > targettotal) {
            targetid = user
            targettotal = temptotal
        }
    }
    userdata.users[targetid].deductions = userdata.users[targetid].deductions - effect
    userdata.users[customerid].deductions = userdata.users[customerid].deductions - cost
    receipt = ">>> Your blueshell hit " + userdata.users[targetid].nick + ". They now have: " + numberWithCommas(Math.round(lib.gettotaltime(customerid, userdata) / (1000 * 60)))
    lib.saveJsonData(userdata, datapath)
    return receipt
}

async function hell(msg, client) {
    let item = "Hell"
    let storepath = "./data/store.json"
    let store = JSON.parse(fs.readFileSync(storepath, 'utf8')).stock

    let cost = store[item].cost * 60000 //cost * conversion to miliseconds
    let receipt = "Not enough money for transaction."
    let customerid = msg.author.id

    let datapath = "./data/data.json"
    let userdata = JSON.parse(fs.readFileSync(datapath, 'utf8'))

    if (lib.gettotaltime(customerid, userdata) <= cost) {
        return receipt
    }

    let usersdcd = 0
    let channels = client.channels.cache.values();
    for (const chan of channels) {
        let members = chan.members.values()
        if (chan.type == 'voice') {
            for (const member of members) {
                if (member.id !== customerid) {
                    usersdcd++
                    let target = client.channels.cache.get(chan.id).members.get(member.id)
                    try {
                        await target.voice.kick();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    }

    userdata.users[customerid].deductions = userdata.users[customerid].deductions - cost
    lib.saveJsonData(userdata, datapath)

    receipt = ">>> Congrats! Hell is your domain! You disconnected " + usersdcd + " users."

    return receipt

}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}