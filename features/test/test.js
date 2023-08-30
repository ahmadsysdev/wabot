module.exports = {
    name: "test",
    async run(client, message, { query, attribute, args, prefix, dev, arg }) {
        const data = await message.getQuotedObj();
        // data.message.contextInfo.isForwarded = false;
        const sendMsg = await client.sendMessage(message.from, { forward: data, withTag: true }, { quoted: message });
    }
}