import { randomBytes, scryptSync } from "node:crypto";

export const defaultPasswordForUsername = (username) => `${username}123`;

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};
