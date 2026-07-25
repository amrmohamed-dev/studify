import mongoose from 'mongoose';

const DB = process.env.DATABASE.replace(
  '<USERNAME>',
  process.env.DATABASE_USERNAME,
).replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

const dbConnection = () => {
  mongoose
    .connect(DB)
    .then(() => console.log('DB Connected successfully'))
    .catch((err) => console.log('Error in DB connection:', err.message));
};

export default dbConnection;
