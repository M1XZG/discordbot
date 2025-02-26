FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm
COPY . /app
WORKDIR /app

ENV DISCORD_TOKEN=DISCORD_TOKEN
ENV API_SERVER=API_SERVER
ENV POSTGRES_URL=POSTGRES_URL
ENV DISCORD_CLIENT_ID=DISCORD_CLIENT_ID
ENV DISCORD_CLIENT_SECRET=DISCORD_CLIENT_SECRET
ENV SERVER_URL=SERVER_URL


FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM base AS build
RUN npm install -g pnpm
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run build

FROM base
RUN npm install -g pnpm
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/build/public /app/public

CMD [ "pnpm", "start" ]