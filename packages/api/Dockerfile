FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build
EXPOSE 3001
CMD ["pnpm", "run", "start"]
