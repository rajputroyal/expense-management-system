import { Sequelize } from 'sequelize';
import 'dotenv/config';

if (!process.env.DB_NAME || !process.env.DB_USER) {
  throw new Error('DB_NAME and DB_USER are required.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: { underscored: true, timestamps: true },
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

export default sequelize;
