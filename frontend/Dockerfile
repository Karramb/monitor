# Stage 1: Сборка
FROM node:21.7.1-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Запуск
FROM node:21.7.1-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/result_build ./build
CMD ["serve", "-s", "build", "-l", "3000"]