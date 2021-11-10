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

    if (shutuplist.length > 0) {
        for (user of shutuplist) {
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
                                        console.error(e)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                shutuplist.shift()
            }
        }
    }


}

function antispam(msg, warnNum, maxNum, clearTime, maxTime, ignoreTime) {
    if (spamMap.has(msg.author.id)) {
        const userdata = spamMap.get(msg.author.id)
        const { lastMessage, timer } = userdata
        const difference = msg.createdTimestamp - lastMessage.createdTimestamp
        let msgCount = userdata.msgCount
        if (difference > clearTime) {
            clearTimeout(timer)
            userdata.msgCount = 1
            userdata.lastMessage = msg
            userdata.timer = setTimeout(() => {
                spamMap.delete(msg.author.id)
            }, maxTime),
                userdata.warned = false
            spamMap.set(msg.author.id, userdata)
        } else {
            ++msgCount
            console.log(msgCount)
            console.log(userdata.warned)
            if (parseInt(msgCount) === warnNum && !userdata.warned) {
                msg.reply('If you keep spamming you will be ignored for ' + (ignoreTime / 60000) + ' minute(s).')
                userdata.warned = true
                spamMap.set(msg.author.id, userdata)
            } else if (parseInt(msgCount) === maxNum && userdata.warned) {
                mutelist.set(msg.author.id)
                setTimeout(() => {
                    mutelist.delete(msg.author.id)
                    msg.reply('You are no longer ignored.')
                }, ignoreTime);
                msg.reply('You will be ignored for the next ' + (ignoreTime / 60000) + ' minute(s).')
            } else {
                userdata.msgCount = msgCount
                spamMap.set(msg.author.id, userdata)
            }
        }
    } else {
        let fn = setTimeout(() => {
            spamMap.delete(msg.author.id)
        }, maxTime)
        spamMap.set(msg.author.id, {
            msgCount: 1,
            lastMessage: msg,
            timer: fn,
            warned: false
        })
    }
}

function cleanslate() {
    let userdata = globaluserdata.users
    for (user in userdata) {
        let stattotal = 0
        let channels = userdata[user].channels
        for (chan in channels) {
            stattotal += channels[chan].time
        }
        userdata[user].deductions = -1 * stattotal
        userdata[user].cooldowns = {}
        userdata[user].work = {
            clockin: "",
            pay: 10,
            bonus: 0,
            bonusStreak: 0,
            lastWork: "",
            workcount: 0
        }
    }
    globaluserdata = userdata
}

module.exports = { checkstates, tempdatainit, saveJsonData, updatedata, gettotaltime, shutdown, shutup, antispam, cleanslate }