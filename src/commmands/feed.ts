import { XMLParser } from "fast-xml-parser";
import { error } from "node:console";
import { parse } from "node:path";
import { createFeed, getFeeds, createFeedFollow, getFeedByUrl, getFeedFollowsForUser, unfollow, getNextFeedToFetch, markFeedFetched } from "src/lib/db/queries/feed";
import { getUser, getUserById } from "src/lib/db/queries/users";
import { users } from "src/lib/db/schema";
import { User, Feed } from "src/lib/db/schema";
import { readConfig } from "src/config";
import { read } from "node:fs";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]){

    if (args.length < 2) {
        throw new Error("adding a feed requires a name and a url")
    }
    const [name, url] = args;
    //const configInfo = await readConfig();
    //const currentUser = configInfo.currentUserName;
    //const user = await getUser(currentUser);
    const userId = await String(user?.id);
  
    const user_use = await {
        id: String(user?.id),
        name: String(user?.name),
        createdAt: new Date(String(user?.createdAt)),
        updatedAt: new Date(String(user?.updatedAt))
        
    }
    const result = await createFeed(name, url, userId);
    if (!result) {
        throw new Error("feed not added");
    }
    const feedFollow = await createFeedFollow(user_use.id, result.id);
    console.log(`Feed added and followed!`);
    console.log(`Feed: ${feedFollow.feedName}`);
    console.log(`User: ${feedFollow.userName}`);
    printFeed(result, user_use)
}
export async function handlerAgg(cmdName: string, ...args: string[]) {
    //const rssFeed = await fetchFeed("https://www.wagslane.dev/index.xml");
    //console.log(rssFeed.channel.item);
    if (args.length !== 1) {
        throw new Error(`usage: ${cmdName} <time_between_reqs>`);
    }

    const timeArg = args[0];
    const timeBetweenRequests = parseDuration(timeArg);
    if (!timeBetweenRequests) {
        throw new Error(`invalid duration: ${timeArg} - use 1h, 30m, 15s, 3500ms`);
    }
    console.log(`Collecting feeds every ${timeArg}...`);

    scrapeFeeds().catch(handleError);

    const interval = setInterval(() => {
        scrapeFeeds().catch(handleError);
    }, timeBetweenRequests);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator....");
            clearInterval(interval);
            resolve();
        });
    });
}

export async function fetchFeed(feedURL: string) {
    //feedURL = "https://www.wagslane.dev/index.xml";
    const response = await fetch(feedURL, {
        headers: {
            "User-Agent": "gator",
        }
    })
    const xml = await response.text();
    const parser = new XMLParser();
    const parsed = parser.parse(xml);
    
    const channel = parsed?.rss?.channel;
    if (!channel) {
        throw new Error('channel invalid')
    }

    const { title, link, description} = channel;
    if (!title || !link || !description){
        throw new Error("Invalid RSS feed, missing metadata");
    }
    
    let rawItems: any[] = [];
    if (channel.item) {
        rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];
    }

    const items: RSSItem[] = [];
    for (const item of rawItems) {
        if(!item.title || !item.link || !item.description || !item.pubDate) {
            continue
        } 
        items.push({
            title: item.title,
            link: item.link,
            description: item.description,
            pubDate: item.pubDate
        });
    }

    return {
        channel: {
            title: title,
            link: link,
            description: description,
            item: items
        }
    }


}

export async function handlerGetAllFeeds(){
    const feeds = await getFeeds();
    if (feeds.length === 0) {
        console.log(`No feeds found.`);
        return;
    }

    console.log(`Found %d feeds: \n`, feeds.length);
    for (let feed of feeds) {
        const user_get = await getUserById(String(feed.userId));
        if (!user_get) {
            throw new Error(`Failed to find user for feed ${feed.id}`);
        }
        
        const user = {
                id: user_get[0].id,
                createdAt: user_get[0].createdAt,
                updatedAt: user_get[0].updatedAt,
                name: user_get[0].name
        }

        printFeed(feed, user);
    }
}

export async function handlerFollow(cmdName: string, user: User, ...args:string[]) {
    if (args.length === 0) {
        throw new Error("no url provided");
    }
    const feed = await getFeedByUrl(args[0]);
    if (!feed) {
        throw new Error(`Feed at ${args[0]} not found`);
    }

    //const user_get = await getUserById(String(feed[0].userId));
    //if (!user_get) {
    //    throw new Error(`Failed to find user for feed ${feed[0].id}`);
    //}
    
    //const userName = await readConfig();
    //const user_get = await getUser(userName.currentUserName);

    //const user = {
    //    id: String(user_get?.id),
    //    name: String(user_get?.name),
    //    createdAt: new Date(String(user_get?.createdAt)),
     //   updatedAt: new Date(String(user_get?.updatedAt))
    //}


    const feedFollow = await createFeedFollow(user.id, feed[0].id);
    console.log(`Now following feed ${feedFollow.feedName}`);
    console.log(`User: ${feedFollow.userName}`);
}


export async function handlerFollowing(cmdName: string, user: User, ...args: string[]) {

    //const userName = await readConfig();
    //const user_get = await getUser(userName.currentUserName);

    //const user = {
    //    id: String(user_get?.id),
    //    name: String(user_get?.name),
    //    createdAt: new Date(String(user_get?.createdAt)),
    //    updatedAt: new Date(String(user_get?.updatedAt))
    //}
    const feedFollows = await getFeedFollowsForUser(user.id);
    console.log(`feeds ${user.name} is following`);
    for (const f of feedFollows) {
        console.log(`* ${f.feedName}`);
    }
}

export async function handlerUnfolow(cmdName: string, user: User, ...args: string[]){
    const result = await unfollow(user.id, args[0]);
    console.log(`Feed ${args[0]} unfollowed for ${user.name}`)
}

export async function printFeed(feed: Feed, user: User): Promise<void> {
  console.log(`ID:         ${feed.id}`);
  console.log(`Name:       ${feed.name}`);
  console.log(`URL:        ${feed.url}`);
  console.log(`User:       ${user.name}`);
  console.log(`Created At: ${feed.createdAt}`);
  console.log(`Updated At: ${feed.updatedAt}`);
}

export async function scrapeFeeds() {
    const feed = await getNextFeedToFetch();
    if (!feed) {
        console.log('No feeds to fetch');
        return;
    }
    console.log(`Fetching feed ${feed.name}`);
}

export async function scrapeFeed(feed: Feed) {
    await markFeedFetched(feed.id);

    const feedData = await fetchFeed(feed.url);

    console.log(`Feed ${feed.name} gathered, found ${feedData.channel.item.length} posts`);
}

export function parseDuration(durationStr: string) {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) return;

  if (match.length !== 3) return;

  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return;
  }
}

function handleError(err: unknown) {
  console.error(
    `Error scraping feeds: ${err instanceof Error ? err.message : err}`,
  );
}