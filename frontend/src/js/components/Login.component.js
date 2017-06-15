const LoginComponent = Vue.component('login', {
  data: function() {
    return {
      username: '',
      password: '',
      invalidCredentials: false
    };
  },
  methods: {
    login: function(username, password) {
      Api.authenticate(username, password)
        .then((response) => {
          const nextUrl = this.$router.currentRoute.query.next || '/';
          this.$router.push(nextUrl);
        })
        .catch((response) => {
          this.invalidCredentials = true;
        })
    }
  },
  template: `
    <div class="col-md-push-4 col-md-4">
      <div class="panel panel-default" id="login-panel">
        <div class="panel-heading">
          <h3 class="panel-title">Home server login</h3>
        </div>
        <div class="panel-body">
          <div class="form-horizontal" action="{% url 'login' %}">
            <label class='control-label' for='username'>
            </label>
            <input v-model='username' type='text' class='form-control' name='username'>
            <label class='control-label' for='password'>Password</label>
            <input v-model='password' type='password' class='form-control' name='password'>
            <br>
            <button v-on:click="login(username, password)" class="btn btn-success btn-block">Log in</button>
          </div>
        </div>
      </div>
    </div>
  `
});