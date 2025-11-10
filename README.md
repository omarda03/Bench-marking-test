# REST API Benchmark Project

This project is designed to benchmark different Java backend frameworks for RESTful APIs, including implementations using Spring REST Controller, Jersey, and Spring Data REST. It also provides a Next.js frontend to interact with these backends and a PostgreSQL database for persistence.

## Project Structure

- `backend/rest-controller-app`: Java Spring REST Controller application
- `backend/jersey-app`: Jersey-based REST application
- `backend/spring-data-rest-app`: Spring Data REST application
- `frontend`: Next.js frontend application
- `db`: PostgreSQL database (Dockerized)
- `jmeter`: scripts, Docker image and data sets to reproduces the load-testing scenarios (InfluxDB v2 backend listener)

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Build and Run the Project with Docker

To build and run all services (backends, frontend, and database) using Docker Compose, run:

```bash
docker compose up --build
```

This command will:

- Build Docker images for all backend and frontend apps.
- Start the PostgreSQL database.
- Launch all services and expose:
  - Backend REST Controller API at [http://localhost:8081](http://localhost:8081)
  - Jersey API at [http://localhost:8082](http://localhost:8082)
  - Spring Data REST API at [http://localhost:8083](http://localhost:8083)
  - Frontend at [http://localhost:3000](http://localhost:3000)
  
The containers will automatically restart if you restart your Docker service.

To shut down and remove all containers, networks, and volumes, use:

```bash
docker compose down -v

## Load Testing (JMeter + InfluxDB v2)

1. **Initialisation**
   ```bash
   docker compose up -d --build influxdb
   ```
   (Les backends + la BDD doivent être démarrés avant de lancer un test.)

2. **Exporter les identifiants** vers `jmeter/data/categories.csv` et `jmeter/data/items.csv` après avoir seedé les 2 000 catégories et 100 000 articles :
   ```sql
   \COPY (SELECT id AS categoryId FROM category ORDER BY id) TO 'jmeter/data/categories.csv' WITH (FORMAT csv, HEADER true);
   \COPY (SELECT id AS itemId FROM item ORDER BY id)       TO 'jmeter/data/items.csv'      WITH (FORMAT csv, HEADER true);
   ```

3. **Lancer un scénario** :
   ```bash
   docker compose run --rm \
     -e SCENARIO=read-heavy \
     -e VARIANT=restcontroller \
     jmeter
   ```
   Scénarios disponibles : `read-heavy`, `join-filter`, `mixed`, `heavy-body`.

Les métriques (samples, latences, erreurs, percentiles…) sont envoyées dans InfluxDB (`org=perf`, bucket=`jmeter`, token=`jmeter-dev-token`). Les rapports HTML et fichiers `.jtl` sont stockés dans `jmeter/results/`.

```

## Notes

- Make sure ports 3000, 8081, 8082, 8083, and 5432 are free on your machine.
- Configuration (database credentials, endpoints, etc.) is managed in the `docker-compose.yml` file.

Enjoy benchmarking your REST APIs!

