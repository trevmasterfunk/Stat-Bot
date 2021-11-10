const { MessageEmbed } = require('discord.js')
const lib = require('../lib.js')

module.exports = {
    name: 'roll',
    description: "This command challenges someone to a deathroll. To start a roll use '-deathroll (bet ammount) (mention challenger)'. To roll use '-deathroll roll'.",
    async execute(message, args) {
        let player = message.author.id
        let matchgame = getgame(player)
        let key = matchgame[0]
        let game = matchgame[1]

        if (key == null || game == null) {
            message.channel.send('You are not currently in a deathroll')
            return
        } else if (game.turn !== player) {
            message.channel.send('It is not your turn!')
            return
        }

        let roll = randomNumber(game.lastroll)

        let nextplayerid
        let nextplayername
        let playername

        switch (player) {
            case game.player1id:
                playername = game.player1name
                nextplayerid = game.player2id
                nextplayername = game.player2name
                break
            case game.player2id:
                playername = game.player2name
                nextplayerid = game.player1id
                nextplayername = game.player1name
                break
        }

        if (roll == 1) {
            globaluserdata.users[nextplayerid].deductions += Math.round(game.wager * 0.95)
            games.delete(key)
            const resultsEmbed = new MessageEmbed()
                .setTitle('Deathroll Won!')
                .setDescription(playername + " has rolled a 1! " + nextplayername + " wins " + (Math.round(game.wager * 0.95) / 60000) + " minutes!")
            await message.channel.send(resultsEmbed)
            return
        }

        games.set(key, {
            player1id: game.player1id,
            player1name: game.player1name,
            player2id: game.player2id,
            player2name: game.player2name,
            wager: game.wager,
            turn: nextplayerid,
            lastroll: roll,
            timeout: game.timeout
        })

        const resultsEmbed = new MessageEmbed()
            .setTitle('Roll Results')
            .setDescription(playername + " rolled a " + roll + ". " + nextplayername + " make your roll!")

        await message.channel.send(resultsEmbed)
    }
}

function getgame(playerid) {
    let thisgame = null;
    let thiskey = null;
    for (let [key, value] of games) {
        if (playerid == value.player1id || playerid == value.player2id) {
            thiskey = key
            thisgame = value
        }
    }
    return [thiskey, thisgame]
}

function randomNumber(max) {
    return Math.floor(Math.random() * max) + 1
}