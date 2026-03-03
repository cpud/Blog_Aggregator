import { XMLParser } from "fast-xml-parser";
import { error } from "node:console";
import { parse } from "node:path";
import { createFeed, getFeeds } from "src/lib/db/queries/feed";
import { getUser, getUserById } from "src/lib/db/queries/users";
import { users } from "src/lib/db/schema";
import { User, Feed } from "src/lib/db/schema";
import { readConfig } from "src/config";

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

export async function handlerAddFeed(cmdName: string, ...args: string[]){

    if (args.length < 2) {
        throw new Error("adding a feed requires a name and a url")
    }
    const [name, url] = args;
    const configInfo = await readConfig();
    const currentUser = configInfo.currentUserName;
    const user = await getUser(currentUser);
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
    printFeed(result, user_use)
}
export async function handlerAgg(cmdName: string, ...args: string[]) {
    const rssFeed = await fetchFeed("https://www.wagslane.dev/index.xml");
    console.log(rssFeed.channel.item);
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
        const user_get = await getUserById(String(feed.user_id));
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

export async function printFeed(feed: Feed, user: User): Promise<void> {
  console.log(`ID:         ${feed.id}`);
  console.log(`Name:       ${feed.name}`);
  console.log(`URL:        ${feed.url}`);
  console.log(`User:       ${user.name}`);
  console.log(`Created At: ${feed.createdAt}`);
  console.log(`Updated At: ${feed.updated_at}`);
}
