const mongoose = require('mongoose')

mongoose
// .connect('mongodb://localhost:27017', { dbName: 'auth_tutorial'})
.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME})
.then(() => {
    console.log('mongodb connected to db.')
})
.catch((err) => {
    console.log(err.message)
})


mongoose.connection.on('connected', () => {
    console.log('mongodb connected');
})

mongoose.connection.on('error', () => {
    console.log('mongodb error');
})

mongoose.connection.on('disconnected', () => {
    console.log('mongodb disconnected');
})

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
})