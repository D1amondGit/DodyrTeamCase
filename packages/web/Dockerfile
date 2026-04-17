FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mobilny-obhodchik/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@mobilny-obhodchik/web", "start"]
