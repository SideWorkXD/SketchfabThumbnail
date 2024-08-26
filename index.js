const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

app.get('/', (req, res) => {
  res.send('Sketchfab Thumbnail API');
});
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!thumbnail')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('Please provide a Sketchfab item URL!');
        }

        const sketchfabURL = args[1];
        const sketchfabIDMatch = sketchfabURL.match(/\/3d-models\/.*-([a-zA-Z0-9]+)$/);

        if (!sketchfabIDMatch) {
            return message.reply('Invalid Sketchfab URL. Please provide a valid Sketchfab model URL.');
        }

        const sketchfabID = sketchfabIDMatch[1];

        try {
            const response = await axios.get(`https://api.sketchfab.com/v3/models/${sketchfabID}`, {
                headers: {
                    'Authorization': `Token ${process.env.SKETCHFAB_API_KEY}`
                }
            });

            const thumbnails = response.data.thumbnails.images;

            // Find the highest resolution thumbnail by sorting them by width
            const highestQualityThumbnail = thumbnails.sort((a, b) => b.width - a.width)[0];

            message.reply(`Here is the highest quality thumbnail: ${highestQualityThumbnail.url}`);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 404) {
                message.reply('Model not found. Please check the URL and try again.');
            } else {
                message.reply('Failed to fetch thumbnail. Please try again later.');
            }
        }
    }
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
