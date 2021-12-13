#!/bin/bash
# SSH_KEY=$(cat ~/.ssh/id_rsa.pub)
NAME=delfast

hcloud server create --datacenter=nbg1-dc3 \
    --image ubuntu-20.04 --type cx11 \
    --ssh-key baden --name $NAME \
    --user-data-from-file config.yml

sleep 10

IP=$(hcloud server ip delfast)

ssh-keygen -R $IP
ssh-keyscan $IP >> ~/.ssh/known_hosts
hcloud server ssh $NAME 'cp .ssh/authorized_keys /home/baden/.ssh/'
hcloud server ssh $NAME 'chown -R baden:baden /home/baden/.ssh'
hcloud server ssh $NAME 'chmod 700 /home/baden/.ssh'
hcloud server ssh $NAME 'chmod 600 /home/baden/.ssh/authorized_keys'


# --- остальное надо переделать на работу с доменным именем (delfast.navi.cc) 94.130.187.98
# . ./genkey.sh "$(hcloud server ip delfast)"
. ./genkey.sh delfast.navi.cc

ssh baden@$IP "mkdir -p /home/baden/.config/delfast_server"
# Посже сделаю нормальную конфигурацию, с путями к файлам ключей и сертификатов
ssh baden@IP "echo 'server' > ~/.config/delfast_server/config.txt"
# scp -r $IP/certs baden@$IP:/home/baden/.config/delfast_server
scp -r delfast.navi.cc/certs baden@$IP:/home/baden/.config/delfast_server

rsync -rzd ../_rel/delfast_server_release/ baden@$IP:/home/baden/delfast_server

# This command must repeat each time after recompile server like this:
# rsync -rzd _rel/delfast_server_release/ baden@$(hcloud server ip delfast):/home/baden/delfast_server
