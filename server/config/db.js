import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campustrade-nitj', {
      // Keeps connection pressure bounded when concurrent requests grow.
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 50,
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 5,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
    //console.log("Database:", mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
