// GET request to check if redis has cached results
// if redis has no cache fall back to postgres
// return result as json

import { NextRequest } from "next/server"
import redis from "@/lib/redis"
import { Client } from "pg";

// read q from the URL

// check redis with redis.get(q)

// if found return it

// if not found query postgres and return results

const client = new Client({
  user: 'user_here',
  database: 'db_name',
  password: 'example12',
  host: 'localhost',
  port: 5432
});

client.connect()

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')


  try {
    if (!q) {
      return new Response('missing query', { status: 400 })
    }

    const redisCache = await redis.get(q)

    if (redisCache) {
      return Response.json(JSON.parse(redisCache))
    } else {
      const pgQuery = await client.query(
        `SELECT result_id, score FROM results_ranking 
        WHERE query = $1 
        ORDER BY score DESC`, [q]
      )
      return Response.json(pgQuery.rows)
    }
  } catch {

  }
} 