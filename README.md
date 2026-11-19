<!-- 
    SPDX-FileCopyrightText: © Fossology contributors
    SPDX-License-Identifier: GPL-2.0-only
-->

# LicenseDB-UI

![LicenseDB-UI](src/assets/images/logo.png)

License as a service provides a convenient and effective way for organizations to manage their open-source licenses and more. With the ever growing list of Open-Source licenses, organizations find it difficult to keep track of obligations of a license, restrictions, and other related information. When you have multiple software working on the domain, keeping them consistent is even more difficult. LicenseDb tries to provide that central store to keep all your Licenses in a neat tool, linked with their respective obligations. LicenseDb, with help of ExternalRef, allows you to keep your custom information about the license tied to it. Designed to be used for various purposes by organizations and tools like FOSSology and SW360 for fast and simple information management and retrieval.

The frontend for [LicenseDB](https://github.com/fossology/LicenseDb).

## API Documentation

- Check the OpenAPI documentation for the API endpoints at
[cmd/laas/docs/swagger.yaml](https://github.com/fossology/LicenseDb/blob/main/cmd/laas/docs/swagger.yaml).

- The same can be viewed by Swagger UI plugin after installing and running the
LicenseDB backend at [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html).

## Prerequisites

- ```NodeJS``` LTS version
- ```npm```
- Using a Node version manager like [```nvm```](https://github.com/nvm-sh/nvm) is strongly recommended for installing ```NodeJS``` and ```npm```.

## Full-Stack Docker Compose Development

The frontend Compose file starts the UI, LicenseDB API, and PostgreSQL as one
stack. It expects a sibling checkout named `LicenseDb`:

```text
workspace/
  LicenseDb/
  LicenseDb-UI/
```

From `LicenseDb-UI`, create a local configuration file and start the stack:

```bash
cp .env.example .env
docker compose up --build --wait
```

Open `http://localhost:8081`. The browser reaches the API through the UI at
`/api/v1`; PostgreSQL and the API are not published to the host.

To use a differently named sibling checkout, such as a feature branch clone,
set `LICENSEDB_BACKEND_CONTEXT` in `.env` to its relative or absolute path.

Validate and stop the stack with:

```bash
docker compose config -q
docker compose ps
curl -fsS http://localhost:8081/api/v1/health
docker compose down
```

Do not run this stack alongside the backend repository's standalone Compose
stack. Each stack creates its own API and PostgreSQL services. Use the frontend
Compose file for full-stack development and deployment; keep the backend
Compose file for API-only development.

### Systemd Deployment

For a server deployment, check out `LicenseDb` and `LicenseDb-UI` as siblings
under `/opt/licensedb`, then place the real Compose variables in
`/etc/licensedb/.env`. Do not commit this file.

Build the images once after source updates:

```bash
cd /opt/licensedb/LicenseDb-UI
sudo /usr/bin/docker compose --env-file /etc/licensedb/.env build
```

Install [docs/licensedb-compose.service](docs/licensedb-compose.service) as
`/etc/systemd/system/licensedb-compose.service`, adjusting the working
directory if needed. Then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now licensedb-compose.service
```

The unit starts the UI, API, and PostgreSQL after Docker and the network are
available. It waits for their health checks but does not rebuild images during
every server boot.

## Local Frontend Development

Set `VITE_BASE_URL` and `VITE_DOMAIN_SUBDIRECTORY` in `.env.local` as needed.
Then install dependencies and start Vite:

```bash
npm ci
npm run dev
```
