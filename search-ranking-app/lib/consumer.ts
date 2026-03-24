// normally run in a seperate service/server 
// but keeping it simple with a simple node js script

// created kafka consumer
// sub to click-events topic
// JSON.parse() each message
// UPDATE results_ranking DB - += click_count and UPDATE score

import { kafka } from './kafka'
import { Client } from 'pg'

// connect to db

const client = new Client({
  user: 'user_here',
  database: 'db_name',
  password: 'example12',
  host: 'localhost',
  port: 5432
});

async function runQuery(resultId: string, query: string) {
  try {
    const res = await client.query(
      `INSERT INTO results_ranking (result_id, query, click_count, score, last_clicked)
    VALUES ($1, $2, 1, 1, NOW())
    ON CONFLICT (result_id, query) 
    DO UPDATE SET 
      click_count = results_ranking.click_count + 1,
      last_clicked = NOW(),
      score = (results_ranking.click_count + 1) * (1.0 / (EXTRACT(EPOCH FROM NOW() - results_ranking.last_clicked) / 86400 + 1))`, [resultId, query])
    console.log(res.rows[0]);
  } catch (err) {
    console.error('query error');
  } finally {
    await client.end()
  }
}

// creating consumer with group id
const consumer = kafka.consumer({ groupId: 'my-group ' })

async function startConsumer() {
  // setting client connect here so we dont open a new db connection for every mesage
  await client.connect();
  // connect consumer
  await consumer.connect()

  // sub to consumer topic(s)
  await consumer.subscribe({ topic: 'click-events', fromBeginning: true })

  // consumer.run() with eachMesage
  await consumer.run({
    eachMessage: async ({ message }) => {

      console.log({
        key: message.key?.toString(),
        value: message.value?.toString(),
        headers: message.headers,
      })
      const { resultId, query } = JSON.parse(message.value?.toString() || '{}')

      runQuery(resultId, query);
    }
  })
}

startConsumer().catch(console.error)