import { db } from "..";
import { feeds, users } from "../schema";
import { eq } from "drizzle-orm";
import { getUserById } from "./users";

export async function createFeed(name: string, url: string, userId: string) {
  console.log(`user id ${userId}`);
  const [result] = await db.insert(feeds).values({name: name, url: url, user_id: userId}).returning();
  return result;
}

export async function getFeeds() {
  const result = await db.select().from(feeds);
  return result;
}
/*
export async function getAllFeeds() {
  let res: Array<{
    name: string,
    url: string,
    username:string
  }> = [{name: "", url: "", username: ""}]
  let results = await db.select().from(feeds);
  const { id, createdAt } = results[0]
  for (let i =0; i< results.length; i++) {
     let {user_id} = results[i]
     let db_name = await getUserById(String(user_id));
     res[i] = {name: results[i].name, url: results[i].url, username: db_name[0].name};
  }
  return res;
}
*/