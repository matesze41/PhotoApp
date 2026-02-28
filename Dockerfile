FROM node:20-bookworm-slim

WORKDIR /app

# Prisma/Node miatt hasznos alap csomagok
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 3000