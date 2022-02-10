source /home/ec2-user/.bashrc
cd /home/ec2-user/apps/redis-search-service
source /usr/local/env/dotenv.env
pm2 stop all
pm2 delete index
pm2 start --node-args="--experimental-modules --es-module-specifier-resolution=node" dist/index.js