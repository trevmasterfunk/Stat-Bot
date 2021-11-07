const fs = require('fs')
const lib = require('../lib.js')
const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'w',
    description: "This is the parent command to work containing all of the worker commands.",
    execute(message, args) {
        let now = new Date()
        let storepath = "./data/store.json"
        let workrules = JSON.parse(fs.readFileSync(storepath, 'utf8')).work

        const embeddedmsg = new MessageEmbed()
            .setTitle('Work')

        let reply
        if (args[0] == 'apply' && args.length == 1) {
            reply = apply(message)
            embeddedmsg.addFields(reply)
        } else if (args[0] == 'clock' && args[1] == 'in' && args.length == 2) {
            reply = clock_in(message, now, workrules)
            embeddedmsg.addFields(reply)
        } else if (args[0] == 'work' && args.length == 1) {
            reply = work(message, now, workrules)
            embeddedmsg.addFields(reply)
        } else if (args[0] == 'help' && args.length == 1) {
            reply = help(workrules)
            embeddedmsg.addFields(reply)
        }

        message.channel.send({ embed: embeddedmsg })

    }
}

function help(rules) {
    return [
        { name: "Apply", value: "Use '-w apply' to apply for this job. You can not use the other commands until this is done." },
        { name: "Clock In", value: "Use '-w clock in' to start your working period. You can clock in every " + rules.clockInCooldown + " hours." },
        {
            name: "Work", value: "Use '-w work' to check in with your boss. You must check in every " + rules.workPeriod + " minutes. " +
                "You do have a " + rules.workWindow + " window after to clock in without punishment. " +
                "Every time you check back in on time you get a bonus point. Every " + rules.bonusMod + " points your bonus pay will increase by " + rules.bonuspay + ". "
        }
    ]
}

function apply(msg) {
    if (!globaluserdata.users[msg.author.id].work) {
        globaluserdata.users[msg.author.id].work = {
            clockin: "",
            pay: 10,
            bonus: 0,
            bonusStreak: 0,
            lastWork: "",
            workcount: 0
        }
        return {
            name: "Application", value: "Congratulations! You're hired! You can start working any time you'd like. Between you and me, stay away from lemon boy... he's kinda weird. Good luck!"
        }
    } else {
        return [
            { name: "Boss", value: msg.author.username + " you already work here! You stupid or somethin?" }
        ]
    }
}

function clock_in(msg, now, rules) {
    if (!globaluserdata.users[msg.author.id].work) {
        return [
            { name: "Boss", value: "Excuse me! You are not an employee! If you want to work so bad why don't you submit an application!" }
        ]
    } else if (((now - globaluserdata.users[msg.author.id].work.clockin) / 3600000) < rules.clockInCooldown) {
        return [
            { name: "Time Clock", value: "You already clocked in today!" }
        ]
    } else {
        userwork = globaluserdata.users[msg.author.id].work
        userwork.clockin = now
        userwork.bonus = 0
        userwork.bonusStreak = 0
        userwork.lastWork = now
        userwork.workcount = 0
        let nextworktime = new Date(now.getTime() + (rules.workPeriod * 60 * 1000)).toLocaleString("en-US")
        return [
            { name: "Time Clock", value: "You are now clocked in. Please check back in " + rules.workPeriod + " minutes." },
            { name: "Check back in at:", value: nextworktime }
        ]
    }
}

function work(msg, now, rules) {
    if (!globaluserdata.users[msg.author.id].work) {
        return [
            { name: "Boss", value: "Excuse me! You are not an employee! If you want to work so bad why don't you submit an application!" }
        ]
    }
    let then = globaluserdata.users[msg.author.id].work.lastWork
    let timediff = (now - then) / 60000
    if (globaluserdata.users[msg.author.id].work.workcount >= rules.maxwork) {
        return [
            { name: "Boss", value: "You've done enough. Get out of here." }
        ]
    } else if (timediff < rules.workPeriod) {
        return [
            { name: "Boss", value: "Leave me alone! It hasent even been " + rules.workPeriod + " minutes yet!" }
        ]
    } else if (timediff > rules.workPeriod && timediff < (rules.workPeriod + rules.workWindow)) {
        userwork = globaluserdata.users[msg.author.id].work
        userwork.lastWork = now
        userwork.workcount += 1
        userwork.bonusStreak += 1
        if ((userwork.bonusStreak % rules.bonusMod) == 0) {
            userwork.bonus += rules.bonuspay
        }
        let pay = userwork.pay + userwork.bonus
        globaluserdata.users[msg.author.id].deductions += pay
        let nextworktime = new Date(now.getTime() + (rules.workPeriod * 60 * 1000)).toLocaleString("en-US")
        return [
            { name: "Boss", value: "Good Job, you can count to " + rules.workPeriod + ". Now lets see if you can do it again", inline: false },
            { name: "Check back in at:", value: nextworktime },
            { name: "Pay", value: userwork.pay, inline: true },
            { name: "Bonus", value: userwork.bonus, inline: true },
            { name: "Total", value: pay, inline: true }
        ]
    } else if (timediff > (rules.workPeriod + rules.workWindow) && timediff < (rules.clockInCooldown * 60)) {
        userwork = globaluserdata.users[msg.author.id].work
        userwork.lastWork = now
        userwork.workcount += 1
        userwork.bonusStreak = 0
        userwork.bonus = 0
        let pay = userwork.pay
        globaluserdata.users[msg.author.id].deductions += pay
        return [
            { name: "Boss", value: "You're late. Its been forever. If you're not careful I'll have to feed you to beandy (scary).", inline: false },
            { name: "Pay", value: userwork.pay, inline: true },
            { name: "Bonus", value: userwork.bonus, inline: true },
            { name: "Total", value: pay, inline: true }
        ]
    } else if (timediff > (rules.clockInCooldown * 3600000)) {
        return [
            { name: "Boss", vlaue: "Where have you been! Clock in!" }
        ]
    }
}