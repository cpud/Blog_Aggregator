A command line interface to collect RSS feeds and display posts. 

Setup:
1) You'll need Node.js version 22.15.0, and local PostgreSQL.
2) In your home directory, create a ".gatorconfig.json" file, set up like this: {
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
  "current_user_name": "holgith"
}
This json file lets the CLI know the current user and the location of the database that stores posts, user info, and feed info.
Replace username, password, and gator with your actual PostgreSQL credentials and database name.

Linux example:
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
}

macOS exmaple:
{
  "db_url": "postgres://wagslane:@localhost:5432/gator?sslmode=disable"
}

3) Clone the repo: git clone https://github.com/cpud/Blog_Aggregator.git
4) Install dependencies: npm install
5) Run database migrations: npx drizzle-kit migrate

Usage:
Run commands with:  npm run start <command> [arguments]

Commands:
addfeed <name> <url>
feeds
follow <url>
reset

agg <time_between_requests>
- Press CTRL+C to stop the aggregator
