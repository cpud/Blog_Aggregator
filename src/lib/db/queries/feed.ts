import { db } from "..";
import { feedFollows, feeds, users } from "../schema";
import { eq} from "drizzle-orm";
import { getUserById } from "./users";
import { create } from "node:domain";

export async function createFeed(name: string, url: string, userId: string) {
  console.log(`user id ${userId}`);
  const [result] = await db.insert(feeds).values({name: name, url: url, userId: userId}).returning();
  return result;
}

export async function getFeeds() {
  const result = await db.select().from(feeds);
  return result;
}

export async function createFeedFollow(userId: string, feedId:string) {
  const [newFeedFollow] = await db.insert(feedFollows).values({userId: userId, feedId: feedId}).returning();
  //const username = await getUserById(userId);
  //const feedname = await getFeedById(feedId);
  const result = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.id, newFeedFollow.id));

  return result[0];
}

export async function getFeedById(feedId: string) {
  const result = await db.select().from(feeds).where(eq(feeds.id, feedId));
  return result;
}

export async function getFeedByUrl(url: string) {
  const result = await db.select().from(feeds).where(eq(feeds.url, url));
  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  return await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      feedName: feeds.name,
      userName: users.name,
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.userId, userId));
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