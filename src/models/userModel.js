const { randomUUID } = require('node:crypto');

const users = [];

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    createdAt: user.createdAt
  };
}

function findByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

function findById(id) {
  return users.find((user) => user.id === id) || null;
}

function createUser(payload) {
  const user = {
    id: randomUUID(),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    organization: payload.organization || '',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  return user;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  toPublicUser
};
