#!/bin/sh

# nginx needs an SSL certificate to start. Acme.sh needs nginx to run to request
# an SSL certificate. Start nginx with a self-signed certificate, fetch a valid
# one, then restart nginx.

# On localhost, the self-signed certificate is enough.

echo "Starting cron..."
crond

CERT_CHAIN_PATH=/etc/ssl-certs/full-chain.pem
PRIVATE_KEY_PATH=/etc/ssl-certs/private-key.pem

function issue_selfsigned_cert() {
  openssl req -x509 -nodes -newkey rsa:4096 -days 30\
    -keyout "$PRIVATE_KEY_PATH" \
    -out "$CERT_CHAIN_PATH" \
    -subj '/CN=localhost'
}

if [ ! -f "$CERT_CHAIN_PATH" ]; then
  echo "No SSL certificate found. Issuing a self-signed certificate to let nginx start."
  issue_selfsigned_cert
fi

if [ "$SSL_DOMAIN" != "localhost" ]; then
  (openssl verify -untrusted "$CERT_CHAIN_PATH" "$CERT_CHAIN_PATH")
  if [ "$?" != 0 ]; then
    echo "Existing SSL certificate found, but it is not valid. Generating new certificate for home.$SSL_DOMAIN and timeline.$SSL_DOMAIN..."

    # Reissue self-signed cert, in case another kind of invalid cert is there
    # and prevents nginx from starting.
    rm "${CERT_CHAIN_PATH}" "${PRIVATE_KEY_PATH}"
    issue_selfsigned_cert

    nginx
    /root/.acme.sh/acme.sh --issue --debug --server letsencrypt -d "home.${SSL_DOMAIN}" -w /var/autossl -d "timeline.${SSL_DOMAIN}"
    /root/.acme.sh/acme.sh --install-cert -d "home.${SSL_DOMAIN}" -d "timeline.${SSL_DOMAIN}" --key-file "$PRIVATE_KEY_PATH" --fullchain-file "$CERT_CHAIN_PATH"
    echo "Certificate installed. Restarting nginx..."
    nginx -s quit;
  else
    echo "Using SSL certificate because it's valid."
  fi
else
  echo "Domain is 'localhost'. Using self-signed certificate."
fi

echo "Starting nginx..."
nginx -g "daemon off;"
