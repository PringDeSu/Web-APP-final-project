envsubst '${WEB_SERVER_FE_PORT} ${WEB_SERVER_BE_PORT} ${BACKEND_SERVER_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g "daemon off;"
