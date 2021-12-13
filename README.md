
Работать с сервером будем по возможности через hcloud-cli

1.  Предварительно, мы создали проект `delfast` [console.hetzner.cloud](https://console.hetzner.cloud/),
    и создали токен.
    Также добавляем SSH ключ их ~/.ssh/id_rsa.pub с именем `baden`

2.  Сконфигурировали `hcloud`:

    hcloud context create my-project

3.  Для удобства, добавим автозавершение в bash:

    source <(hcloud completion bash)

4.  Возможно, для корректной работы `hcloud` в скриптах, надо установить переменные окружения:

    * `HCLOUD_TOKEN`
    * `HCLOUD_CONTEXT`
    * `HCLOUD_CONFIG`

### Работа с сервером

    hcloud server create --datacenter=nbg1-dc3 --image ubuntu-20.04 --type cx11 --ssh-key baden --name delfast

    Ждем секунд 20, пока сервер будет создан и запущен.



## Про сертификаты.

Я немного помудохался с самоподписными сертификатами. Вцелом вроде бы и победил, но хочется еще попробовать letsencrypt

C ppa:certbot/certbot че-то не срослось, не нашло для focal

sudo apt install certbot
sudo certbot certonly --standalone -n -d delfast.navi.cc --email baden.i.ua@gmail.com --agree-tos
sudo mcedit /etc/cron.d/letsencrypt_renew
Вставить строку:
15 3 * * * /usr/bin/certbot renew --quiet

Получили следующее:
IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/delfast.navi.cc/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/delfast.navi.cc/privkey.pem
   Your cert will expire on 2022-02-05. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - Your account credentials have been saved in your Certbot
   configuration directory at /etc/letsencrypt. You should make a
   secure backup of this folder now. This configuration directory will
   also contain certificates and private keys obtained by Certbot so
   making regular backups of this folder is ideal.
 - If you like Certbot, please consider supporting our work by:



В конфиг потом надо будет добавить:

groups:
  - ssl-cert
users:
  - baden:
  ...
    groups: users, admin, ssl-cert
runcmd:
  - export DOMAIN="delfast.navi.cc"
  - export EMAIL="baden.i.ua@gmail.com"
  - certbot certonly --standalone -n -d $DOMAIN --email $EMAIL --agree-tos
  - chgrp -R ssl-cert /etc/letsencrypt
  - chmod -R g=rX /etc/letsencrypt
write_files:
  - owner: root:root
    path: /etc/cron.d/letsencrypt_renew
    content: "15 3 * * * /usr/bin/certbot renew --quiet"


### По поводу SSL.
Попробуем использовать `stream_ssl_module` c nginx. (TBD: потом еще и Brotli добавим)

```
apt-get install --no-install-recommends -y wget git unzip lsb-release gnupg2 dpkg-dev ca-certificates
echo "deb-src http://nginx.org/packages/`lsb_release -is | tr '[:upper:]' '[:lower:]'` `lsb_release -cs` nginx" | tee /etc/apt/sources.list.d/nginx.list
wget http://nginx.org/keys/nginx_signing.key && apt-key add nginx_signing.key && rm nginx_signing.key
apt-get update
cd /tmp
apt-get source nginx
apt-get build-dep nginx --no-install-recommends -y
git clone https://github.com/wandenberg/nginx-push-stream-module.git nginx-push-stream-module
cd nginx-1*
sed -i "s@--with-stream_ssl_module@--with-stream_ssl_module --add-module=/tmp/nginx-push-stream-module @g" debian/rules
dpkg-buildpackage -uc -us -b
cd ..
mv nginx_1*_amd64.deb nginx.deb
apt-get install --no-install-recommends -y libssl1.1 lsb-base
dpkg -i /tmp/nginx.deb

```
