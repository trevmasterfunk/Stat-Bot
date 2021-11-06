# Stat-Bot
 
The Stat-Bot is a discord bot that will track all users time in voice channels. With this time they can buy different items such as a blueshell (cost 30 minutes, takes 60 minutes away from highest worth user) or hell (cost 2400 minutes, disconnects every user from the discord).

### Current Goals
- Add more items to shop
- Make the bot server specific
   - currency is only gained in the server a user is connected to
   - ranks command only shows ranks of users in server the command was sent in
   - items only affect users in server item was bought in
### Setup
In order to run this bot yourself you will need a file named "data.json" stored in the same folder as store.json containing the following code:
```
{
  "users": {},
  "banned": {}
}
```
As well as a ".env" file containing:
```
BOTTOKEN = YOUR BOT TOKEN HERE
```
