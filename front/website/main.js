var socketURL = '/'
var securifyURL = '/securify'
var profileURL = 'https://securify-server.herokuapp.com/'

var app = new Vue({
  el: '#app',
  data: () => ({
    email: '',
    deviceName: '',
    showForm: false,
    waiting: false,
    error: null,
    connected: false,
    socket: null
  }),
  methods: {
    async login () {
      this.waiting = true
      console.log(`logging ${this.email} in`)
      try {
        if (!localStorage.getItem('email')) {
          localStorage.setItem('email', this.email)
        }

        localStorage.setItem('deviceName', this.deviceName)

        const response = await axios.post(securifyURL, {
          email: this.email,
          deviceName: this.deviceName
        })

        console.log(response)

        this.socket.on(response.data.requestId, (response) => {
          console.log('received a response !', response)
          const { validated, reason, token } = response
          this.connected = validated
          
          localStorage.setItem('email', this.email)
          
          if (!validated) {
            this.error = `Login denied: ${reason}`
          } else {
            localStorage.setItem('securifyToken', token)
            this.securifyToken = token
          }
        })
      } catch (e) {
        try {
          this.error = `Something went wrong: ${e.response.data.message}`
        } catch (ex) {
          this.error = 'Something went wrong'
        }
        console.error(e)
      }
    },
    async validateToken () {
      if (!this.securifyToken) {
        return
      }

      try {
        const client = axios.create({
          headers: { 'Authorization': this.securifyToken }
        })
        // TODO: gestion des erreurs propre
        const response = await client.get(profileURL)
        const { user } = response.data
        if (user._id) {
          this.connected = true
        }
      } catch (e) {
        console.log('token verification failed:', e.response && e.response.data)
        // Possible reasons:
        //  - invalid token
        //  - expired token
        //  - server down
      }
    }
  },
  created () {
    this.socket = io(socketURL)
    this.email = localStorage.getItem('email')
    this.deviceName = localStorage.getItem('deviceName')
    this.securifyToken = localStorage.getItem('securifyToken')
    this.validateToken()
  }
})
