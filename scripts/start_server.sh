source /home/ec2-user/.bash_profile
cd /home/ec2-user/apps/redis-search-service
source /usr/local/env/dotenv.env
pm2 start dist/index.js