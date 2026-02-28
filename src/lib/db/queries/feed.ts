import { db } from "..";
import { feeds } from "../schema";

export async function createFeed(name: string, url: string, userId: string) {
  console.log(`user id ${userId}`);
  const [result] = await db.insert(feeds).values({name: name, url: url, user_id: userId}).returning();
  return result;
}