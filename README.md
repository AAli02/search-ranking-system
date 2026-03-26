# Search Ranking System

A real-time search ranking system that tracks user clicks, 
streams events through Kafka, and re-ranks results using a scoring formula 
that factors in click count and recency. 
Results are cached in Redis so repeated queries are fast.

## How it works

```
User clicks result
      |
Next.js API route (/api/track-click)
      |
Kafka producer -> [click-events topic]
      |
Kafka consumer (background worker)
      |
PostgreSQL (upsert + recalculate score)
      |
Redis (cache updated results per query)
      |
/api/search -> Redis first, Postgres fallback
```

## Stack

- Next.js 15 + TypeScript
- Apache Kafka (KafkaJS)
- Redis (ioredis)
- PostgreSQL 15
- Docker Compose

## Project structure

| File | What it does |
|---|---|
| `app/search/page.tsx` | Search UI, leaderboard, event console |
| `app/api/track-click/route.ts` | Receives clicks, sends to Kafka |
| `app/api/search/route.ts` | Returns ranked results from Redis or Postgres |
| `app/api/rankings/route.ts` | Returns full leaderboard |
| `lib/consumer.ts` | Reads from Kafka, updates DB and Redis |
| `lib/kafka.ts` | Kafka client and producer |
| `lib/redis.ts` | Redis client |
| `docker-compose.yml` | Kafka, Zookeeper, Redis, Postgres |

## Scoring formula

```
score = click_count * (1.0 / (days_since_last_click + 1))
```

Runs as an atomic upsert in Postgres. 
Recent clicks score higher than older clicks of the same count.

## Getting started

### Requirements
- Docker Desktop
- Node.js 18+

### 1. Clone

```bash
git clone https://github.com/AAli02/search-ranking-system.git
cd search-ranking-system
```

### 2. Environment variables

Create `search-ranking-app/.env`:

```
DB_USER=user_here
DB_NAME=db_name
DB_PASSWORD=example12
DB_HOST=localhost
DB_PORT=5432
```

### 3. Start infrastructure

```bash
docker compose up
```

### 4. Create the table

```bash
docker exec -it search-ranking-postgres-1 psql -U user_here -d db_name
```

```sql
CREATE TABLE results_ranking (
  result_id VARCHAR(255),
  query VARCHAR(255),
  click_count INT DEFAULT 0,
  score FLOAT DEFAULT 0,
  last_clicked TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (result_id, query)
);
```

### 5. Seed data (optional)

```sql
INSERT INTO results_ranking (result_id, query, click_count, score, last_clicked) VALUES
('nextjs-docs', 'nextjs', 5, 4.5, NOW()),
('react-docs', 'react', 8, 7.2, NOW()),
('kafka-guide', 'kafka', 3, 2.8, NOW()),
('redis-docs', 'redis', 6, 5.1, NOW()),
('postgres-tutorial', 'postgres', 4, 3.6, NOW());
```

### 6. Run the app

```bash
cd search-ranking-app
npm install
npm run dev
```

### 7. Run the consumer

In a separate terminal:

```bash
cd search-ranking-app
npm run consumer
```

### 8. Open

```
http://localhost:3000/search
```

---

## Why Kafka

Writing to Postgres directly on every click does not scale. At high traffic, 
you get thousands of competing writes per second. Kafka decouples the click from the processing. 
The API returns immediately and the consumer handles the ranking update on its own, 
without blocking anything.
