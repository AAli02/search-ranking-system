// connecting frontend to kafka 
// track clicks with a POST route

// JSOB body with userId, resultId, and query

// READ the REQUEST BODY
// RETURN JSON RESPONSE
// CONSOLE.LOG the DATA and RETURN 200 RESPONSE

import { NextRequest } from "next/server"
import { producer } from '@/lib/kafka'

export async function POST(request: NextRequest) {

  try {
    // get data first
    const { userId, resultId, query } = await request.json()
    // assign data to clickData
    const clickData = { userId, resultId, query, timestamp: Date.now() }

    await producer.connect();

    await producer.send({
      topic: 'click-events',
      messages: [{ value: JSON.stringify(clickData)}]
    })

    console.log(userId, resultId, query)

    await producer.disconnect()

  } catch (error) {
    return new Response('Failed!', { status: 400 })
  }

  return new Response('Success!', {
    status: 200,
  })
}