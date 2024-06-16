pm2 delete blog
export NODE_ENV=production && pm2 start --name blog --node-args="--experimental-modules --es-module-specifier-resolution=node" dist/index.js