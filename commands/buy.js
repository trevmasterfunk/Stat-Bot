const fs = require('fs')
const { MessageEmbed } = require('discord.js')
const lib = require('./../lib.js')

module.exports = {
    name: 'buy',
    description: "This command will allow you to buy items from the shop. For example '-buy blueshell' will buy a blueshell if you have enough currency.",
    async execute(message, args, client) {
        let storepath = "./data/store.json"
        let store = JSON.parse(fs.readFileSync(storepath, 'utf8'))

        let datapath = "./data/data.json"
        let data = JSON.parse(fs.readFileSync(datapath, 'utf8'))

        if (!data.users[message.author.id]) {
            message.channel.send("You have not yet logged time in statbot. Join a channel then leave or wait 5 minutes to be entered into the log.")
            return
        }

        if (args[0] == null) {
            message.channel.send("Invalid entry.")
            return
        }
        let buyitem
        for (item in store.stock) {
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
            case "Scramble":
                reply = await randomnames(message)
                break
        }

        const embeddedmsg = new MessageEmbed()
            .setTitle('Receipt')
        embeddedmsg.setDescription(reply)


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


    let userdata = globaluserdata
    if (lib.gettotaltime(customerid, userdata) <= cost) {
        return receipt
    }

    let now = new Date()
    let then = -999999999999999
    if (!userdata.users[customerid].cooldowns[item]) {
        userdata.users[customerid].cooldowns[item] = now
    } else {
        then = new Date(userdata.users[customerid].cooldowns[item])
    }
    if ((now - then) < store[item].cooldown && then != now) {
        receipt = item + " is on cooldown for you. Try again in " + Math.round((((store[item].cooldown - (now - then)) / 3600000)) * 10) / 10 + " Hours"
        return receipt
    }
    userdata.users[customerid].cooldowns[item] = now

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
    receipt = "Your purchase of " + item + " was successful!\n "
    receipt = receipt + ">>> Your blueshell hit " + userdata.users[targetid].nick + ". They now have: " + numberWithCommas(Math.round(lib.gettotaltime(targetid, userdata) / (1000 * 60)))

    globaluserdata = userdata
    return receipt
}

async function hell(msg, client) {
    let item = "Hell"
    let storepath = "./data/store.json"
    let store = JSON.parse(fs.readFileSync(storepath, 'utf8')).stock

    let cost = store[item].cost * 60000 //cost * conversion to miliseconds
    let receipt = "Not enough money for transaction."
    let customerid = msg.author.id

    let userdata = globaluserdata

    if (lib.gettotaltime(customerid, userdata) <= cost) {
        let receipt = "Not enough money for transaction."
        return receipt
    }

    let now = new Date()
    let then = -999999999999999
    if (!userdata.users[customerid].cooldowns[item]) {
        userdata.users[customerid].cooldowns[item] = now
    } else {
        then = new Date(userdata.users[customerid].cooldowns[item])
    }
    if ((now - then) < store[item].cooldown && then != now) {
        receipt = item + " is on cooldown for you. Try again in " + Math.round((((store[item].cooldown - (now - then)) / 3600000)) * 10) / 10 + " Hours"
        return receipt
    }
    userdata.users[customerid].cooldowns[item] = now

    let usersdcd = 0
    let channels = client.channels.cache.values()
    for (const chan of channels) {
        let members = chan.members.values()
        if (chan.type == 'voice') {
            for (const member of members) {
                if (member.id !== customerid) {
                    usersdcd++
                    let target = client.channels.cache.get(chan.id).members.get(member.id)
                    try {
                        await target.voice.kick()
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        }
    }

    userdata.users[customerid].deductions = userdata.users[customerid].deductions - cost
    globaluserdata = userdata

    receipt = "Your purchase of " + item + " was successful!\n "
    receipt = receipt + ">>> Congrats! Hell is your domain! You disconnected " + usersdcd + " users."

    return receipt

}

async function randomnames(msg) {
    let item = "Scramble"
    let storepath = "./data/store.json"
    let store = JSON.parse(fs.readFileSync(storepath, 'utf8')).stock

    let cost = store[item].cost * 60000 //cost * conversion to miliseconds

    let receipt = "Not enough money for transaction."
    let customerid = msg.author.id

    //checks if customer has enough money
    let userdata = globaluserdata
    if (lib.gettotaltime(customerid, userdata) <= cost) {
        return receipt
    }

    //checks if customer is on cooldown
    let now = new Date()
    let then = -999999999999999
    if (!userdata.users[customerid].cooldowns[item]) {
        userdata.users[customerid].cooldowns[item] = now
    } else {
        then = new Date(userdata.users[customerid].cooldowns[item])
    }
    if ((now - then) < store[item].cooldown && then != now) {
        receipt = item + " is on cooldown for you. Try again in " + Math.round((((store[item].cooldown - (now - then)) / 3600000)) * 10) / 10 + " Hours"
        return receipt
    }
    userdata.users[customerid].cooldowns[item] = now

    let allchannels = msg.guild.channels.cache
    let usernames = []
    let changeableusers = []

    for (const chan of allchannels) {
        if (chan[1].type == 'voice') {
            let users = await chan[1].members
            for (let user of users) {
                if (msg.guild.ownerID !== user[1].id && !user[1].user.bot) {
                    if (user[1].nickname == null) {
                        usernames.push(user[1].user.username)
                    } else {
                        usernames.push(user[1].nickname)
                    }
                    changeableusers.push(user)
                }
            }

        }
    }
    shuffle(usernames)
    for (let user of changeableusers) {
        let rand = getrandom(usernames.length)
        await user[1].setNickname(usernames[rand])
        // console.log(user[1].user.username + " : " + usernames[rand]) //used for testing without actually doing anything. comment line above
        usernames.splice(rand, 1)
    }

    userdata.users[customerid].deductions = userdata.users[customerid].deductions - cost
    receipt = "Your purchase of " + item + " was successful!\n "
    receipt = receipt + ">>> All names have been scrambled! Can you tell who is who? ;)"

    globaluserdata = userdata
    return receipt
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}

function getrandom(max) {
    return Math.floor(Math.random() * max)
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}