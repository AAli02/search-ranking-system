// export redis client || localhost:6379
// most bare min redis setup (we will use this in the consumer)

import { Redis } from "ioredis"

// defaults to 6379 apparently 
const redis = new Redis();

export default redis
