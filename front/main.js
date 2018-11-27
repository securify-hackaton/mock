var app = new Vue({
  el: '#app',
  data: () => ({
    email: '',
    showForm: false,
    waiting: false,
    error: null,
  }),
  methods: {
    async login () {
      this.waiting = true
      console.log(`logging ${this.email} in`)
      try {
        const response = await axios.post('http://localhost:3001/handle', {
          email: this.email
        })

        console.log(response)
      } catch (e) {
        this.error = 'Logging in failed'
        console.error(e)
      }
    }
  }
})
