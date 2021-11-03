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

function checkstates(oldv, newv) {  //called when there is a voicestateupdate event. checks to see if anyone joined, left, or moved voice channels
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

function updatedata() {  //called in intervals to save user progress incase something happens to bot
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
    saveJsonData(data, jsonpath)
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

function saveJsonData(file, save_path) {  //used lots of places to save an object into a json file
    fs.writeFile(save_path, JSON.stringify(file), (err) => {
        if (err) console.error(err)
    })
}

module.exports = { checkstates, tempdatainit, saveJsonData, updatedata, gettotaltime }