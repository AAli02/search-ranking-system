// Kafka client that connects to localhost:9092 (kafka host #)

import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'search-ranking',
  brokers: ['localhost:9092'],
})

export const producer = kafka.producer()