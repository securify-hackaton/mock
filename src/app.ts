import * as bodyParser from 'body-parser'
import * as express from 'express'
import { Request, Response, NextFunction } from 'express'
import * as mongoose from 'mongoose'
import * as socketIo from 'socket.io'
import { createServer, Server } from 'http'
import * as cors from 'cors'
import * as morgan from 'morgan'
import axios from 'axios'

class App {
  private server: Server
  private privateKey: string = process.env.PRIVATE_KEY
  private securifyURL: string = process.env.SECURIFY_URL
  private io: SocketIO.Server

  public app: express.Application

  constructor() {
    if (!this.privateKey) {
      throw new Error('PRIVATE_KEY is mandatory')
    }
    if (!this.securifyURL) {
      throw new Error('SECURIFY_URL is mandatory')
    }
    this.app = express()
    this.config()
    this.routesSetup()
    this.socketSetup()
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
    this.app.route('/securify').post(this.handleAuthWithSecurify)
    this.app.route('/callback').post(this.handleCallback)
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
      const response = await axios.post(`${this.securifyURL}/authorize`, {
        privateKey: this.privateKey,
        email: req.body.email
      })
      console.log('transmitting to securify: ', response)
      res.status(response.status).send({ message: 'ok' })

    } catch (e) {
      console.log(e)
      res.status(500).send(e)
    }
  }

  private handleCallback(req: Request, res: Response) {

  }
}

export default new App().app
