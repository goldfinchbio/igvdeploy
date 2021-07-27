#!/bin/bash
yum update -y
yum install -y git gcc-c++ make 
curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash - 
yum install -y nodejs php-fpm

wget https://github.com/igvteam/igv-webapp/archive/refs/heads/master.zip
unzip master.zip
cd /igv-webapp-master
npm i browser-sync
npm install --global http-server
npm install
npm run build

server_name=`curl http://169.254.169.254/latest/meta-data/local-ipv4`
npx http-server -a ${server_name} -p replace_port -t0 & exit