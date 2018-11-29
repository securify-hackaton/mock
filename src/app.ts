import * as bodyParser from 'body-parser'
import * as express from 'express'
import { Request, Response, NextFunction } from 'express'
import * as mongoose from 'mongoose'
import * as socketIo from 'socket.io'
import { createServer, Server } from 'http'
import * as cors from 'cors'
import * as morgan from 'morgan'
import axios from 'axios'

const privateKey: string = process.env.PRIVATE_KEY
const publicKey: string = process.env.PUBLIC_KEY
const securifyURL: string = process.env.SECURIFY_URL
const frontSkin: string = process.env.FRONT_SKIN || 'epsi'

class App {
  private server: Server
  private io: SocketIO.Server

  public app: express.Application

  constructor() {
    if (!privateKey) {
      throw new Error('PRIVATE_KEY is mandatory')
    }
    if (!publicKey) {
      throw new Error('PUBLIC_KEY is mandatory')
    }
    if (!securifyURL) {
      throw new Error('SECURIFY_URL is mandatory')
    }
    this.app = express()
    this.config()
    this.socketSetup()
    this.routesSetup()
    this.listen()
  }

  private config(): void {
    this.app.use(cors())
    this.app.use(morgan('combined'))
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: false }))
  }

  private socketSetup(): void {
    this.server = createServer(this.app)
    this.io = socketIo(this.server)
  }

  private routesSetup(): void {
    this.app.options('*', cors())
    this.app.use('/', express.static(`front/${frontSkin}`))
    this.app.route('/securify').post(this.handleAuthWithSecurify)
    this.app.route('/callback').post(this.handleCallback(this.io))
  }

  private listen(): void {
    let port: number
    try {
      // Setting the default PORT to 3001
      if (!process.env.BIDON_PORT) {
        throw new Error('BIDON_PORT is mandatory')
      }
      port = parseInt(process.env.BIDON_PORT, 10)
    } catch (e) {
      port = 3001
    }

    this.server.listen(port, () => {
      console.log('Running server on port %s', port)
    })

    this.io.on('connect', (socket: any) => {
      console.log('Connected client on port %s.', port)

      socket.on('disconnect', () => {
        console.log('Client disconnected')
      })
    })
  }

  private async handleAuthWithSecurify(req: Request, res: Response): Promise<void> {
    if (!req.body.email) {
      res.status(400).send({ message: 'email is mandatory' })
      return
    }
    try {
      const response = await axios.post(`${securifyURL}`, {
        privateKey,
        publicKey,
        userEmail: req.body.email
      })
      console.log('transmitted to securify: ', response.data)
      res.status(response.status).send({ requestId: response.data.requestId })
    } catch (e) {
      console.log(e.response.data)
      try {
        res.status(400).send({ message: e.response.data.message })
      } catch (ex) {
        console.log('unknown error:', ex)
        res.status(500).send(({ message: 'unknown error'}))
      }
    }
  }

  // Inject socket.io into the request
  private handleCallback(io) {
    return function (req: Request, res: Response) {
      io.emit(req.body.requestId, req.body)
      res.status(200).send({ message: 'received' })
    }
  }
}

export default new App().app
