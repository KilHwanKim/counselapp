import { MongoClient } from 'mongodb';
const url = 'mongodb+srv://admin:8phCvDGSnCbozl0a@cluster0.fequsdy.mongodb.net/';

const options = { }
let connectDB

if (process.env.NODE_ENV === 'development') {
  if (!global._mongo) {
    global._mongo = new MongoClient(url, options).connect();
  }
  connectDB = global._mongo
} else {
  connectDB = new MongoClient(url, options).connect();
}
export { connectDB }