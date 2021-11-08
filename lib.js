const fs = require('fs')

function tempdatainit(bot) {  //initializes global temp object based on who is in the discord currently
    let banlist = "./data/data.json"
    let banned = JSON.parse(fs.readFileSync(banlist, 'utf8'))
    banned = banned.banned

    let now = new Date()
    let channels = bot.channels.cache
    channels.forEach(chan => {
        if (chan.type !== "voice") { return }
        let users = chan.members
        if (users.size == 0) { return }
        let channelId = chan.id
        let channelName = chan.name
        users.forEach(person => {
            if (!banned[person.user.id] && !person.user.bot) {
                tempdata.users[person.user.id] = {
                    'nick': person.user.username,
                    'channelId': channelId,
                    'channelName': channelName,
                    'entered': now
                }
            }
        })
    })
}

function checkstates(oldv, newv, client) {  //called when there is a voicestateupdate event. checks to see if anyone joined, left, or moved voice channels
    let banlist = "./data/data.json"
    let banned = JSON.parse(fs.readFileSync(banlist, 'utf8'))
    banned = banned.banned

    let now = new Date()
    let userId = newv.id
    let usernick = newv.member.nickname
    let oldChannelId
    let oldChannelNick
    let newChannelId
    let newChannelNick

    shutup(client)

    if (banned[userId]) { return }

    if (oldv.channelID == null) {
        oldChannelId = null
        oldChannelNick = null
    } else {
        oldChannelId = oldv.channelID
        oldChannelNick = oldv.channel.name
    }

    if (newv.channelID == null) {
        newChannelId = null
        newChannelNick = null
    } else {
        newChannelId = newv.channelID
        newChannelNick = newv.channel.name
    }

    if (oldChannelId == newChannelId) { return }


    if (oldChannelId == null) {
        //member joined
        addtotemp(userId, usernick, newChannelId, newChannelNick, now)
    } else if (newChannelId == null) {
        //member left
        updatetime(userId, now)
    } else {
        //member moved
        updatetime(userId, now)
        addtotemp(userId, usernick, newChannelId, newChannelNick, now)
    }
}

function addtotemp(userid, username, channelId, channelName, now) {  //used to add user to the global temp object
    tempdata.users[userid] = {
        'nick': username,
        'channelId': channelId,
        'channelName': channelName,
        'entered': now
    }
}

function updatetime(userid, now) {  //called in checkstats if it is found that a user has left or moved channels. used to save their progress into the data file
    let jsonpath = "./data/data.json"
    let data = globaluserdata
    let user = tempdata.users[userid]
    let timediff = now - user.entered
    if (!data.users[userid]) {
        data.users[userid] = {
            nick: user.nick,
            channels: {},
            cooldowns: {},
            deductions: 0
        }
        data.users[userid].channels[user.channelId] = {
            name: user.channelName,
            time: timediff
        }
    } else {
        let oldtime
        if (!data.users[userid].channels[user.channelId]) {
            oldtime = 0
        } else {
            oldtime = data.users[userid].channels[user.channelId].time
        }
        data.users[userid].channels[user.channelId] = {
            name: user.channelName,
            time: oldtime + (timediff)
        }
    }
    delete tempdata.users[userid]
    globaluserdata = data
}

async function updatedata() {  //called in intervals to save user progress incase something happens to bot
    busy = true
    let jsonpath = "./data/data.json"
    let data = globaluserdata
    let now = new Date()

    for (const userid in tempdata.users) {
        let user = tempdata.users[userid]
        let timediff = now - user.entered
        tempdata.users[userid].entered = now
        if (!data.users[userid]) {
            data.users[userid] = {
                nick: user.nick,
                channels: {},
                cooldowns: {},
                deductions: 0
            }
            data.users[userid].channels[user.channelId] = {
                name: user.channelName,
                time: timediff
            }
        } else {
            let oldtime
            if (!data.users[userid].channels[user.channelId]) {
                oldtime = 0
            } else {
                oldtime = data.users[userid].channels[user.channelId].time
            }
            data.users[userid].channels[user.channelId] = {
                name: user.channelName,
                time: oldtime + (timediff)
            }
        }
    }
    await saveJsonData(data, jsonpath)
    busy = false
}

function gettotaltime(userid, data) {
    let userdata = data.users[userid]
    let channels = userdata.channels
    let deductions = userdata.deductions
    let total = 0

    for (chan in channels) {
        total += channels[chan].time
    }
    total = total + deductions
    return total
}

async function saveJsonData(file, save_path) {  //used lots of places to save an object into a json file
    try {
        await fs.promises.writeFile(save_path, JSON.stringify(file))
    } catch (err) {
        console.log(err)
    }
}

async function shutdown(client) {
    await updatedata()
    client.destroy()
    throw new Error("Bot shutting down")
}

async function shutup(client) {

    if (mutelist.length > 0) {
        for (user of mutelist) {
            let userid = user.id
            let tts = new Date(user.stopat)
            let now = new Date()
            console.log((now - tts) / 60000)
            if ((now - tts) < 0) {
                var channels = client.channels.cache.values()
                for (let i = 0; i < client.channels.cache.size; i++) {
                    var chan = channels.next().value
                    if (chan.type === 'voice') {
                        var chanid = chan.id
                        var members = chan.members.keys()
                        for (let j = 0; j <= chan.members.size; j++) {
                            if (members.next().value === userid) {
                                var membertarget = client.channels.cache.get(chanid).members.get(userid).voice
                                if (!membertarget.serverMute) {
                                    try {
                                        await membertarget.setMute(true)
                                    } catch (e) {
                                        // console.error(e)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                mutelist.shift()
            }
        }
    }


}

module.exports = { checkstates, tempdatainit, saveJsonData, updatedata, gettotaltime, shutdown, shutup }