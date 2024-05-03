FROM repositoriopolitecnico.azurecr.io/app/cliente:latest AS builder

WORKDIR /app

COPY . .

RUN scnode_cli --deploy prod --dist /app/backend_dist --package_name campus_virtual_icontec

FROM repositoriopolitecnico.azurecr.io/app/cliente:latest AS prod

WORKDIR /app

COPY --from=builder /app/backend_dist /app/

RUN npm install

RUN npm install -g phantomjs-prebuilt --unsafe-perm

RUN npm install html-pdf -g --unsafe-perm

RUN npm link html-pdf

EXPOSE 3000

CMD ["node","./src/app/server.js"]
