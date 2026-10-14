# SPDX-FileCopyrightText: 2026 Siemens AG
# SPDX-License-Identifier: GPL-2.0-only
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

ARG VITE_BASE_URL=/api/v1
ARG VITE_DOMAIN_SUBDIRECTORY=
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_DOMAIN_SUBDIRECTORY=$VITE_DOMAIN_SUBDIRECTORY

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80