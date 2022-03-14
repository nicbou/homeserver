FROM nginx:mainline-alpine

RUN apk add openssl

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY scripts/start.sh ./start.sh
COPY scripts/renew-ssl-cert.sh /etc/periodic/hourly/renew-ssl-cert

ARG SSL_DOMAIN
ARG SSL_EMAIL
ENV SSL_DOMAIN=${SSL_DOMAIN}
ENV SSL_EMAIL=${SSL_EMAIL}

RUN curl https://get.acme.sh | sh -s email=$SSL_EMAIL

ENTRYPOINT ./start.sh