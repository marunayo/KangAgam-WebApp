import mongoose from 'mongoose';
import { seedDatabase } from './seed.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.ATLAS_URI);
    console.log("MongoDB database connection established successfully");
    console.log(`Connected to database: '${conn.connection.db.databaseName}'`);

    await seedDatabase();
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); 
  }
};

export default connectDB;