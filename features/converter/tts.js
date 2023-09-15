const { createWriteStream } = require('fs');
const { join } = require('path');
const axios = require('axios');

// Export the module
module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'text2speech',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['tomp3', 'text2mp3', 'tts'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'A versatile text-to-speech for generating audio from text.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'converter',

    /**
     * Indicates if this command requires waiting for async operations.
     * @type {boolean}
     */
    wait: true,

    /**
     * Indicates if this command requires parameter.
     * @type {boolean}
     */
    param: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.reply - Reply object.
     */
    async run(client, message, { reply, queries }) {
        // List of available voices
        const voices = [
            '21m00Tcm4TlvDq8ikWAM', '2EiwWnXFnvU5JabPnv8n',
            'AZnzlk1XvdvUeBnXmlld', 'CYw3kZ02Hs0563khs1Fj',
            'D38z5RcWu1voky8WS1ja', 'EXAVITQu4vr4xnSDxMaL',
            'ErXwobaYiN019PkySvjV', 'GBv7mTt0atIp3Br8iCZE',
            'IKne3meq5aSn9XLyUdCD', 'LcfcDJNUP1GQjkzn1xUU',
            'MF3mGyEYCl7XYWbV9V6O', 'N2lVS1w4EtoT3dr4eOWO',
            'ODq5zmih8GrVes37Dizd', 'SOYHLrjzK2X1ezoPC6cr',
            'TX3LPaxmHKxFdv7VOQHJ', 'ThT5KcBeYPX3keUQqHPh',
            'TxGEqnHWrfWFTfGW9XjX', 'VR6AewLTigWG4xSOukaG',
            'XB0fDUnXU5powFXDhCwa', 'XrExE9yKIg1WjnnlVkGX',
            'Yko7PKHZNXotIFUBG7I9', 'ZQe5CZNOzWyzPSCn5a3c',
            'Zlb1dXrM653N07WRdFW3', 'bVMeCyTHy58xNoL34h3p',
            'flq6f7yk4E4fJM5XTYuZ', 'g5CIjZEefAph4nQFvHAz',
            'jBpfuIE2acCO8z3wKNLl', 'jsCqWAovK2LkecY7zXl4',
            'oWAxZDx7w5VEj9dCyTzz', 'onwK4e9ZLuTAKqWW03F9',
            'pMsXgVXv3BLzUgSXRplE', 'pNInz6obpgDQGcFmaJgB',
            'piTKgcLEGmPE4e6mEKli', 't0jbNlBVZ17f02VDIeMI',
            'wViXBPUzp2ZZixB1xQuM', 'yoZ06aMxZJJ28mfd3POQ',
            'z9fAnlkpzviPz146aGWa', 'zcAOhNBS3c14rBihAFp1',
            'zrHiDhphv9ZnVXBqCLjz'
        ]

        // Chunk size for streaming audio
        const chunk_size = 1024;

        // Select random voice from the list
        const random = Math.floor(Math.random() * voices.length);

        // Apikey
        const apikey = '9aa9fd16e6f15a47e4920c6308573195';

        // Endpoint
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voices[random]}`;
        const headers = {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apikey
        }
        const data = {
            'text': queries,
            'model_id': 'eleven_monolingual_v1',
            'voice_settings': {
                'stability': 0.5,
                'similarity_boost': 0.5
            }
        }
        axios.post(url, data, { headers, responseType: 'stream'}).then((x) => {
            const filepath = join('.', 'temp', `${Date.now()}.mp3`);

            // Create a write stream to save the audio
            const outputStream = createWriteStream(filepath);

            // Stream the audio data and write it into the file
            x.data.on('data', (chunk) => {
                outputStream.write(chunk);
            })

            // When the stream ends, send the audio as a voice message
            x.data.on('end', async () => {
                outputStream.end();
                return await client.sendMedia(message.from, filepath, undefined, message, ptt=true);
            })
        })
    }
};