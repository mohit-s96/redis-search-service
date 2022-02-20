## search, comment and auth service

While building an autocomplete search for my [blog](https://mohits.dev), I ran into a bottleneck with vercel serveless functions. I couldn't get the search query time as low as I wanted because upstash redis didn't have a cloud instance anywhere near me.

So I made this nodejs server, hosted it on a ec2 instance and the queries went sub 100ms. Initially it was just for search but later I added the comment service and the github authentication service to this as well because redis is very fast and I like the freedom you get with having your own VPS.

### setup

- The ec2 instance is configured with nginx as the reverse-proxy and a node process managed with pm2. It runs a redis service locally.
- For nodejs I use express.
- It uses route based folder structure with a custom replacement for the require directory package to load all the routers and initializers at application start.
- Uses zod for runtime schema validation.

### run

> requires a redis instance running on your machine the connection url, password in the env file

install dependencies

```bash
yarn
```

run local server (uses the [tsc-watch](https://www.npmjs.com/package/tsc-watch) package)

```bash
yarn dev
```

build

```bash
yarn build
```
