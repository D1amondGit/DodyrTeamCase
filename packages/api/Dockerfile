FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mobilny-obhodchik/api db:generate
RUN pnpm --filter @mobilny-obhodchik/api build
EXPOSE 3001
CMD ["pnpm", "--filter", "@mobilny-obhodchik/api", "start"]
