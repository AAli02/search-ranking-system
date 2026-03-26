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
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT)
})

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
      return Response.json({ results: JSON.parse(redisCache), source: 'redis' })
    } else {
      const pgQuery = await client.query(
        `SELECT result_id, score FROM results_ranking 
        WHERE query = $1 
        ORDER BY score DESC`, [q]
      )
      return Response.json({ results: pgQuery.rows, source: 'postgres' })
    }
  } catch (error) {
    console.log('Producer error:', error)
    return new Response('Failed!', { status: 400 })
  }
} 