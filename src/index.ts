//import { readConfig, setUser } from "./config";
import { CommandsRegistry,
         registerCommand,
         runCommand,
 } from "./commmands/commands"; 
import { handlerLogin } from "./commmands/user";
import { handlerRegister } from "./commmands/user";
import { handlerReset } from "./commmands/user";
import { handlerUsers } from "./commmands/user";
import { handlerAgg } from "./commmands/feed";
import { handlerAddFeed } from "./commmands/feed";


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
    registerCommand(commandsRegistry, "addfeed", handlerAddFeed);

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