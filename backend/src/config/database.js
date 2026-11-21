import { Sequelize } from 'sequelize';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { isProduction } from './environment.js';

if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_PORT) {
  throw new Error('DB_NAME, DB_USER, DB_HOST and DB_PORT are required.');
}

const caCertificate = process.env.DB_CA_CERT
  ? process.env.DB_CA_CERT.replace(/\\n/g, '\n')
  : process.env.DB_CA_CERT_PATH
    ? fs.readFileSync(path.resolve(process.cwd(), process.env.DB_CA_CERT_PATH))
    : undefined;

if (isProduction && !caCertificate) {
  throw new Error('DB_CA_CERT is required in production.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    logging: !isProduction && process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true
    },
    dialectOptions: caCertificate
      ? { ssl: { ca: caCertificate, minVersion: 'TLSv1.2' } }
      : undefined,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
