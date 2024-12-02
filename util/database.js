import { MongoClient } from 'mongodb'
const url = 'mongodb+srv://admin:FekOXsixVc0KqJiA@cluster0.fequsdy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const options = { }
let connectDB

// if (process.env.NODE_ENV === 'development') {
//   if (!global._mongo) {
//     global._mongo = new MongoClient(url, options).connect()
//   }
//   connectDB = global._mongo
// } else {
//   connectDB = new MongoClient(url, options).connect()
// }
export { connectDB }