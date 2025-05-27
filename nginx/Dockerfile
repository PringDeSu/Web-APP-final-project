FROM nginx:alpine
COPY ./frontend /app
COPY ./nginx.conf /etc/nginx/nginx.conf.template
COPY ./start.sh /start.sh
WORKDIR /app
RUN apk update && apk add npm bash
RUN npm i && npm run build
CMD ["bash", "/start.sh"]


