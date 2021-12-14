#!/usr/bin/env bash

GREEN='\033[0;32m'
NC='\033[0m' # No Color
printf "${GREEN}1. Build${NC}\n"

npm run build || exit 1
rsync -rzd ./dist/ baden@delfast.navi.cc:/home/baden/delfast_server_web/web/
#rsync -rzd ./debian-configs/etc baden@delfast.navi.cc:/home/baden/delfast_server_web/
