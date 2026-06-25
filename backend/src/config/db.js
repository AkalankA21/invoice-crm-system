import { Sequelize } from 'sequelize';

// Temporary debug logs for DB connection environment
console.log('DB_ENV in db.js - before Sequelize init');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'invoice_crm',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: false,
      timestamps: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const { syncModels } = await import('../models/index.js');
    await syncModels();
    console.log(`MySQL connected: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'invoice_crm'}`);
  } catch (error) {
    console.error('MySQL connection error:', error);
    // Helpful debug details if available
    try {
      if (error.sql) console.error('SQL:', error.sql);
      if (error.original) console.error('Original Error:', error.original);
    } catch (e) {
      console.error('Error printing debug info', e);
    }
    process.exit(1);
  }
};

export default connectDB;
