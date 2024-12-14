import { MongoClient } from 'mongodb'
const url = 'mongodb+srv://test:W11nI9zDXvRlVroc@cluster0.3i0c8.mongodb.net/'
const options = { }
let connectDB

if (process.env.NODE_ENV === 'development') {
  if (!global._mongo) {
    global._mongo = new MongoClient(url, options).connect()
  }
  connectDB = global._mongo
} else {
  connectDB = new MongoClient(url, options).connect()
}
export { connectDB }