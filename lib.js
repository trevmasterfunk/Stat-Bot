const fs = require('fs')

function tempdatainit(bot) {
    let now = new Date()
    let channels = bot.channels.cache
    channels.forEach(chan => {
        if (chan.type !== "voice") { return }
        let users = chan.members
        if (users.size == 0) { return }
        let channelId = chan.id
        let channelName = chan.name
        tempdata.users = {}
        users.forEach(person => {
            tempdata.users[person.user.id] = {
                'nick': person.user.username,
                'channelId': channelId,
                'channelName': channelName,
                'entered': now
            }
        });
    });
}

function checkstates(oldv, newv) {

    let now = new Date()
    let userId = newv.id
    let usernick = newv.member.nickname
    let oldChannelId
    let oldChannelNick
    let newChannelId
    let newChannelNick

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

function addtotemp(userid, username, channelId, channelName, now) {
    tempdata.users[userid] = {
        'nick': username,
        'channelId': channelId,
        'channelName': channelName,
        'entered': now
    }
}

function updatetime(userid, now) {
    let jsonpath = "./data/data.json"
    let data = JSON.parse(fs.readFileSync(jsonpath, 'utf8'))
    let user = tempdata.users[userid]
    let timediff = now - user.entered
    if (!data.users[userid]) {
        data.users[userid] = {
            nick: user.nick,
            total: timediff,
            channels: {}
        }
        data.users[userid].channels[user.channelId] = {
            name: user.channelName,
            time: timediff
        }
    } else {
        data.users[userid].total = data.users[userid].total + timediff
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
    saveJsonData(data, jsonpath)
}

function saveJsonData(file, save_path) {
    fs.writeFile(save_path, JSON.stringify(file), (err) => {
        if (err) console.error(err)
    })
}

module.exports = { checkstates, tempdatainit, saveJsonData };