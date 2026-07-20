FROM oven/bun

WORKDIR /app

COPY package*.json bun*.lock ./
RUN bun ci

COPY . .

ENV PORT=80
EXPOSE 80

ENV DB_HOST=mysql-server
ENV DB_PORT=3306
ENV DB_NAME=todos_db
ENV DB_USER=root
ENV DB_PASSWORD=root

ENTRYPOINT [ "bun", "run", "start" ]