const Bot = require('node-telegram-bot-api');
const axios = require('axios');
const Redis = require("ioredis");

const botToken = '1243012315:AAHCT23YV6OMjlrvOIx7pqNIdeSNz0zBNZI';
const bot = new Bot(botToken, { polling: true });
const redis = new Redis(13483,
    'redis-13483.c239.us-east-1-2.ec2.cloud.redislabs.com', {
    password: "tnLTqOtMolROfnbm2wUslFdh1yBBaW9U"
})

bot.onText(/\/riddle/, (msg, match) => {
    console.debug('got a riddle');
    const client = msg.chat.id;

    axios.get('http://jservice.io/api/random')
        .then(response => {
            const riddleRaw = response.data;

            if (riddleRaw.length < 1) throw 'got 0 questions from the service';

            redis.set(client, JSON.stringify(riddleRaw[0]));
            bot.sendMessage(client, `Here's a riddle for you: ${riddleRaw[0].question}`,
                {
                    reply_markup: { keyboard: [['Ready for the answer']] }
                })
        })
        .catch(err => {
            console.error('error', err.message);
            bot.sendMessage(client, `Couldn't find any riddle that match your wisdom, try again later`);
        });
});

bot.onText(/Ready for the answer/, (msg, match) => {
    const client = msg.chat.id;
    redis.get(client, (err, res) => {
        if (err) bot.sendMessage(client, 'Ops, seems like I cant find the answer... Sorry');
        const answer = JSON.parse(res).answer;

        bot.sendMessage(client, `The answer is: ${answer}`).then(() =>
            bot.sendMessage(client, `Hope you got it right! Feel free to ask for more`)
        );
    });
});
