import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './mongodb';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUser(email, password, name) {
  const db = await getDb();
  const existingUser = await db.collection('users').findOne({ email });
  
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
  
  const user = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    name,
    role,
    createdAt: new Date().toISOString()
  };

  await db.collection('users').insertOne(user);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserByEmail(email) {
  const db = await getDb();
  return await db.collection('users').findOne({ email });
}

export async function getUserById(id) {
  const db = await getDb();
  const user = await db.collection('users').findOne({ id });
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}
