//import { readConfig, setUser } from "./config";
import { CommandsRegistry,
         registerCommand,
         runCommand,
 } from "./commmands/commands"; 
import { handlerLogin } from "./commmands/user";
import { handlerRegister } from "./commmands/user";
import { handlerReset } from "./commmands/user";
import { handlerUsers } from "./commmands/user";
import { handlerAgg, handlerFollow, handlerFollowing, handlerUnfolow } from "./commmands/feed";
import { handlerAddFeed } from "./commmands/feed";
import { handlerGetAllFeeds } from "./commmands/feed";
import { UserCommandHandler, CommandHandler } from "./commmands/commands";
import { readConfig } from "./config";
import { getUser } from "./lib/db/queries/users";
import { handlerBrowse } from "./commmands/posts";
//import { middlewareLoggedIn } from "./middleware/loggedIn.ts"

export function middleWareLoggedIn(handler: UserCommandHandler): CommandHandler {
    return async (cmdName: string, ...args: string[]) => {
        const cfg = readConfig();
        if (!cfg.currentUserName) throw new Error ("Not logged in");
        const user = await getUser(cfg.currentUserName);
        if (!user) throw new Error (`User ${cfg.currentUserName} does not exist`);
        await handler(cmdName, user, ...args);
    }
}


async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log("usage: cli <command> [args...]");
        process.exit(1);
    }

    const cmdName = args[0];
    const cmdArgs = args.slice(1);
    const commandsRegistry: CommandsRegistry= {};

    registerCommand(commandsRegistry, "login", handlerLogin);
    registerCommand(commandsRegistry, "register", handlerRegister);
    registerCommand(commandsRegistry, "reset", handlerReset);
    registerCommand(commandsRegistry, "users", handlerUsers);
    registerCommand(commandsRegistry, "agg", handlerAgg);
    registerCommand(commandsRegistry, "addfeed", middleWareLoggedIn(handlerAddFeed));
    registerCommand(commandsRegistry, "feeds", handlerGetAllFeeds);
    registerCommand(commandsRegistry, "follow", middleWareLoggedIn(handlerFollow));
    registerCommand(commandsRegistry, "following", middleWareLoggedIn(handlerFollowing));
    registerCommand(commandsRegistry, "unfollow", middleWareLoggedIn(handlerUnfolow));
    registerCommand(commandsRegistry, "browse", middleWareLoggedIn(handlerBrowse));


    try {
        await runCommand(commandsRegistry, cmdName, ...cmdArgs);
    } catch (err) {
        if (err instanceof Error) {
            console.error(`Error running command ${cmdName}: ${err.message}`)
        } else {
            console.error(`Error running command ${cmdName}: ${err}`);
        }
      process.exit(1);
    }

    process.exit(0);
}

main();
//process.exit(0);