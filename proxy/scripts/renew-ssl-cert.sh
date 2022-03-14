#!/bin/sh
/root/.acme.sh/acme.sh --install-cert -d $SSL_DOMAIN \
    --key-file       /etc/ssl-certs/private-key.pem \
    --fullchain-file /etc/ssl-certs/full-chain.pem \
    --reloadcmd "nginx -s reload"
