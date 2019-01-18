/**
 * HTTPS UNIT TESTS FOR SOCKPRESS.
 */

import common from './common'
import server from './scripts/https'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

describe('Sockpress (HTTPS)', () => {
  const BASEURL = 'https://localhost:3334'

  beforeEach(() => {
    server.start()
  })

  afterEach(function (done) {
    server.stop(done)
  })

  describe('Basic Features', common(BASEURL))
})
