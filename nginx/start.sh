echo VITE_SERVER_LOCATION=$SERVER_IP_ADDRESS > ./.env &&
npm i &&
npm run build &&
envsubst '${WEB_SERVER_PORT} ${BACKEND_SERVER_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
nginx -g "daemon off;"
