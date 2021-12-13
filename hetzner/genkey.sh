#!/bin/bash

if test $# -eq 0; then
    echo "Usage: ./genkey.sh <path to store certs directory>"
    exit 0
elif test $# -ne 1; then
    echo "Invalid number of arguments"
    exit 1
fi

ROOTPATH="$1"

# make directories to work from
mkdir -p $ROOTPATH/certs/{server,client,ca,tmp}

PATH_CA=$ROOTPATH/certs/ca
PATH_SERVER=$ROOTPATH/certs/server
PATH_CLIENT=$ROOTPATH/certs/client
PATH_TMP=$ROOTPATH/certs/tmp

RSABITS=4096
EXPIREDAYS=36500

echo -n "Expire days [$EXPIREDAYS]:"

while [ ${#PASSWORD} -lt 4 ]; do
    echo -n "Password for certs []:"
    read -s PASSWORD
    echo
    if [ ${#PASSWORD} -lt 4 ]; then
        echo "Password length cannot be lower than 4 chars"
    fi
done

echo -e "\n################"
echo -e "# OpenSSL conf #"
echo -e "################\n"

# Classic openssl prompt
# echo -n "(C) Country Name (2 letter code) [$GK_C]:"
GK_C="UA"

# echo -n "(ST) State or Province Name (full name) []:"
GK_ST="."

# echo -n "(L) Locality Name (eg, city) []:"
GK_L="Dnipro"

# echo -n "(O) Organization Name (eg, company) [$GK_O]:"
GK_O="Delfast"

# echo -n "(OU) Organizational Unit Name (eg, section) []:"
GK_OU="."

# echo -n "(CN) Common Name (eg, your name or your server's hostname) []:"
# GK_CN="localhost"
GK_CN=$ROOTPATH

# echo -n "(emailAddress) Email Address []:"
GK_emailAddress="baden.i.ua@gmail.com"

if [ ${#GK_emailAddress} -gt 0 ]; then
    GK_emailAddress="/emailAddress=$GK_emailAddress"
fi

GK_unstructuredName=""
GK_unstructuredName="/unstructuredName=$GK_unstructuredName"

echo -e "\n##################"
echo -e "# Generate certs #"
echo -e "##################\n"

######
# CA #
######

echo -e "# CA\n"

openssl genrsa -des3 -passout pass:$PASSWORD -out $PATH_CA/ca.key $RSABITS

# Create Authority Certificate
openssl req -new -x509 -days $EXPIREDAYS -key $PATH_CA/ca.key -out $PATH_CA/ca.crt -passin pass:$PASSWORD -subj "/C=$GK_C/ST=$GK_ST/L=$GK_L/O=$GK_O/OU=$GK_OU/CN=.$GK_unstructuredName$GK_emailAddress$GK_subjectAltName$OTHER_FIELDS"
# openssl req -new -x509 -days $EXPIREDAYS -key $PATH_CA/ca.key -out $PATH_CA/ca.crt -passin pass:$PASSWORD -subj "/C=$GK_C/ST=$GK_ST/L=$GK_L/O=$GK_O/OU=$GK_OU/CN=$GK_CN$GK_unstructuredName$GK_emailAddress$GK_subjectAltName$OTHER_FIELDS"

##########
# SERVER #
##########

echo -e "\n# Server\n"

# Generate server key
openssl genrsa -out $PATH_SERVER/server.key $RSABITS

# Generate server cert
openssl req -new -key $PATH_SERVER/server.key -out $PATH_TMP/server.csr -passout pass:$PASSWORD -subj "/C=$GK_C/ST=$GK_ST/L=$GK_L/O=$GK_O/OU=$GK_OU/CN=$GK_CN$GK_unstructuredName$GK_emailAddress$GK_subjectAltName$OTHER_FIELDS"

# Sign server cert with self-signed cert
openssl x509 -req -days $EXPIREDAYS -passin pass:$PASSWORD -in $PATH_TMP/server.csr -CA $PATH_CA/ca.crt -CAkey $PATH_CA/ca.key -set_serial 01 -out $PATH_SERVER/server.crt

##########
# CLIENT #
##########

echo -e "\n# Client\n"

openssl genrsa -out $PATH_CLIENT/client.key $RSABITS

openssl req -new -key $PATH_CLIENT/client.key -out $PATH_TMP/client.csr -passout pass:$PASSWORD -subj "/C=$GK_C/ST=$GK_ST/L=$GK_L/O=$GK_O/OU=$GK_OU/CN=CLIENT$GK_unstructuredName$GK_emailAddress$GK_subjectAltName$OTHER_FIELDS"

openssl x509 -req -days 365 -passin pass:$PASSWORD -in $PATH_TMP/client.csr -CA $PATH_CA/ca.crt -CAkey $PATH_CA/ca.key -set_serial 01 -out $PATH_CLIENT/client.crt

# Clean tmp dir

rm -rf $PATH_TMP

echo -e "\nDone !"
