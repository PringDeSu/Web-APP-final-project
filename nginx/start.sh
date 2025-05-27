envsubst '${WEB_SERVER_FE_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g "daemon off;"
