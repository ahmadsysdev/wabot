module.exports = {
    name: "error",
    async run(client, message) {
        throw('Error!');
    }
}