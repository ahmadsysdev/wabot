module.exports = {
    name: "test",
    async run(client, message, { query, attribute, args, prefix, dev, arg }) {
        //send a template message!
        const templateButtons = [
            { index: 1, urlButton: { displayText: '⭐ Star Baileys on GitHub!', url: 'https://github.com' } },
            { index: 2, callButton: { displayText: 'Call me!', phoneNumber: '+1 (234) 5678-901' } },
            { index: 3, quickReplyButton: { displayText: 'This is a reply, just like normal buttons!', id: 'id-like-buttons-message' } },
        ]

        const templateMessage = {
            text: "Hi it's a template message",
            footer: 'Hello World',
            templateButtons: templateButtons, viewOnce: true
        }

        const sendMsg = await client.sendMessage(message.from, templateMessage);
    }
}