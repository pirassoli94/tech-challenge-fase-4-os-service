# Usa uma imagem leve do Node.js
FROM node:22-alpine

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia primeiro os arquivos de dependências
COPY package*.json ./

# Instala apenas as dependências necessárias em produção
RUN npm ci --omit=dev

# Copia o restante do código
COPY . .

# Documenta a porta utilizada pelo OS Service
EXPOSE 3000

# Inicia o OS Service
CMD ["node", "index.js"]