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
        const response = await axios.post('http://localhost:3001/securify', {
          email: this.email
        })

        console.log(response)

        this.socket.on(response.data.requestId, (response) => {
          console.log('received a response !', response)
          const { validated, reason } = response
          this.connected = validated
          
          if (!validated) {
            this.error = `Login denied: ${reason}`
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
    }
  },
  created () {
    this.socket = io('http://localhost:3001')
  }
})
