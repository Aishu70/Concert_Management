import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;

if (!uri) {
  throw new Error("Please add MONGODB_URI to .env.local");
}

if (!databaseName) {
  throw new Error("Please add MONGODB_DATABASE to .env.local");
}

const globalForMongo = globalThis;

const clientPromise =
  globalForMongo.mongoClientPromise ||
  new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = clientPromise;
}

export async function getMongoDb() {
  const client = await clientPromise;
  return client.db(databaseName);
}