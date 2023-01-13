const redis = require('redis');

const client = redis.createClient({
    port: 6379,
    host: "127.0.0.1"
});

client.on('connect', () => {
    console.log("Client is connected to redis...")
})

client.on('ready', () => {
    console.log("Client is connected to server and is ready to use...")
})

client.on('error', () => {
    console.log(err.message)
})

client.on('end',  () => {
    console.log("Client disconnected to redis.")
})

process.on('SIGINT', () => {
    client.quit()
})

module.exports = client