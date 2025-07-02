# Stage 1: сборка приложения
FROM node:21.7.1-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# Stage 2: запуск через serve (легковесный HTTP-сервер)
FROM node:21.7.1-alpine

# Устанавливаем serve глобально
RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/build ./build

# Запускаем сервер на порту 3000
CMD ["serve", "-s", "build", "-l", "3000"]