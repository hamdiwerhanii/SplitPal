import mongoose from 'mongoose';

export default async function globalTeardown() {
  globalThis.__SPLITPAL_SERVER__?.kill();

  const uri = process.env.E2E_DATABASE_URI;
  if (uri && /\/splitpal-e2e-\d+$/.test(uri)) {
    const connection = await mongoose.createConnection(uri).asPromise();
    await connection.dropDatabase();
    await connection.close();
  }
}
