// GET all rankings to display on frontend

import { Client } from "pg";

const client = new Client({
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT)
})

client.connect()

export async function GET() {
  try {
    const pgQuery = await client.query(
      `SELECT *
        FROM results_ranking
        ORDER BY score DESC`
    )
    return Response.json(pgQuery.rows)
  } catch (error) {
    console.log(error)
    return new Response('Failed!', { status: 400 })
  }
}