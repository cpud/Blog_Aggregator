import { read } from "node:fs";
import { setUser, readConfig } from "../config";
import { createUser, getUser, deleteUsers, getUsers } from "../lib/db/queries/users";

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (args.length !== 1) {
    throw new Error(`usage: ${cmdName} <name>`);
  }

  const userName = args[0];
  const existingUser = await getUser(userName);
  if (!existingUser) {
    throw new Error(`User ${userName} not found`);
  }

  setUser(existingUser.name);
  console.log("User switched successfully!");
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (args.length != 1) {
    throw new Error(`usage: ${cmdName} <name>`);
  }

  const userName = args[0];
  const user = await createUser(userName);
  if (!user) {
    throw new Error(`User ${userName} not found`);
  }

  setUser(user.name);
  console.log("User created successfully!");
}

export async function handlerReset(cmdName: string, ...args: string[]) {
  await deleteUsers();
}

export async function handlerUsers(cmdName: string, ...args: string[]) {
  const config = await readConfig();
  const currentUserName = config.currentUserName;
  const results = await getUsers();
  if (results.length > 0) {
    for (var result of results) { 
      if (result.name === currentUserName) {
        console.log(`* ${result.name} (current)`);
      } else{
        console.log(`* ${result.name}`);
      }
    }
  }
}