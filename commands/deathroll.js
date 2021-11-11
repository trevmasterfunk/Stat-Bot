const { MessageEmbed } = require('discord.js')
const lib = require('../lib.js')

module.exports = {
    name: 'deathroll',
    description: "This command challenges someone to a deathroll. To start a roll use '-deathroll (bet ammount) (mention challenger) (first roll upper limit)'. To roll use '-roll'.",
    async execute(message, args) {

        //check to see if more than one user is mentioned and that a bet is placed
        if (message.mentions.users.size !== 1 || (args[0] == null) || (isNaN(parseInt(args[0], 10)))) {
            const resultsEmbed = new MessageEmbed()
                .setTitle('Transaction Failed')
                .setDescription("Invalid Input")
            await message.channel.send(resultsEmbed)
            return
        }

        let wager = args[0] * 60000
        let challenged = message.mentions.users.entries().next().value
        let challengedid = challenged[0]
        if (lib.gettotaltime(message.author.id, globaluserdata) <= wager && wager > 0 && lib.gettotaltime(challengedid, globaluserdata) <= wager) {
            const resultsEmbed = new MessageEmbed()
                .setTitle('Transaction Failed')
                .setDescription("Not enough money.")
            await message.channel.send(resultsEmbed)
            return
        }


        let upperlimit
        if (args[2]) {
            upperlimit = args[2]
        } else {
            upperlimit = 10000
        }

        if ((parseInt(upperlimit, 10)) < 100 || (isNaN(parseInt(upperlimit, 10)))) {
            const resultsEmbed = new MessageEmbed()
                .setTitle('Transaction Failed')
                .setDescription("first roll upper limit must be at least 100")
            await message.channel.send(resultsEmbed)
            return
        }

        deathroll(message, args, upperlimit)

    }
}


async function deathroll(msg, args, upperlimit) {


    let challengerid = msg.author.id
    let challenger = msg.author.username
    let challenged = msg.mentions.users.entries().next().value
    let challengedid = challenged[0]
    challenged = challenged[1]
    let wager = args[0] * 60000

    let timetoaccept = 10000
    let maxtimeout = 300000

    const embed = new MessageEmbed()
        .setTitle("Deathroll Challenge")
        .setDescription(challenger + ' has challenged ' + challenged.username + ' to a deathroll between 1 and ' + upperlimit + '! ' +
            challenged.username + ', react with 👍 to accept challenge or 👎 to decline challenge')
        .setTimestamp();

    try {
        let filter = (reaction, user) => {
            if (user.bot) return false;
            if (['👍', '👎'].includes(reaction.emoji.name)) {
                if (user.id == challengedid) {
                    return true
                } else {
                    return false
                }
            }
        }
        let challengemsg = await msg.channel.send(embed);
        await challengemsg.react('👍');
        await challengemsg.react('👎');
        let reactions = await challengemsg.awaitReactions(filter, { time: timetoaccept });
        let thumbsUp = reactions.get('👍');
        let thumbsDown = reactions.get('👎');

        let accepted = 0, declined = 0
        if (thumbsUp)
            accepted += thumbsUp.users.cache.filter(u => !u.bot).size;
        if (thumbsDown)
            declined += thumbsDown.users.cache.filter(u => !u.bot).size;

        let response
        if (accepted > 0 && declined > 0) {
            response = "Challenged is... challenged. They both accepted and declined!"
        } else if (accepted > 0) {
            response = 'Challenge Accepted! ' + challenger + " hit your roll!"
            key = challengerid + ":" + challengedid
            removemoney(challengerid, challengedid, wager)
            let fn = setTimeout(() => {
                msg.channel.send("Users failed to finish in time")
                returnmoney(challengerid, challengedid, wager)
                games.delete(key)
            }, maxtimeout);

            games.set(key, {
                player1id: challengerid,
                player1name: challenger,
                player2id: challengedid,
                player2name: challenged.username,
                wager: (wager * 2),
                turn: challengerid,
                lastroll: upperlimit,
                timeout: fn
            })
        } else if (declined > 0) {
            response = 'Challenge Declined!'
        } else {
            response = 'No response from challenged :('
        }

        const resultsEmbed = new MessageEmbed()
            .setTitle('Challenge response')
            .setDescription(response)
        await msg.channel.send(resultsEmbed);
    }
    catch (err) {
        console.log(err);
    }
}

function removemoney(p1, p2, wager) {
    globaluserdata.users[p1].deductions = globaluserdata.users[p1].deductions - wager
    globaluserdata.users[p2].deductions = globaluserdata.users[p2].deductions - wager
}

function returnmoney(p1, p2, wager) {
    globaluserdata.users[p1].deductions = globaluserdata.users[p1].deductions + wager
    globaluserdata.users[p2].deductions = globaluserdata.users[p2].deductions + wager
}