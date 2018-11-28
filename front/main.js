var socketURL = 'http://localhost:3001'
var securifyURL = 'http://localhost:3001/securify'
var profileURL = 'http://localhost:3000/'

var app = new Vue({
  el: '#app',
  data: () => ({
    email: '',
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
        if (!localStorage['email']) {
          localStorage['email'] = this.email
        }

        const response = await axios.post(securifyURL, {
          email: this.email
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
          this.error = `Logging in failed: ${e.response.data.message}`
        } catch (ex) {
          this.error = 'Logging in failed'
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
    this.securifyToken = localStorage.getItem('securifyToken')
    this.validateToken()
  }
})
