FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 5173

# O docker-compose monta ./frontend em /app e guarda node_modules em um volume.
# O `npm install` na subida mantém esse volume em dia caso o package.json mude;
# se falhar (ex.: sem rede), o servidor sobe mesmo assim com o que já existe.
CMD ["sh", "-c", "npm install --no-audit --no-fund; npm run dev -- --host 0.0.0.0"]
