import supertest from 'supertest'
import { App } from '@scnode_app/app'

const app = new App('test').app
const api = supertest(app)
jest.setTimeout(10000)

describe('Enrollment Test Suite', () => {

  /*===============================================
  =            Estructura de un test            =
  ================================================
    // La estructura de un test debe ser la siguiente:
    test('ModuleName: /route - description of what is expected', async () => {})
  /*======  End of Estructura de un test  =====*/

})
