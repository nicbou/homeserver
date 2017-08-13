class ApiService {
  constructor(apiUrl = '/') {
    this._axiosInstance = axios.create({
      baseURL: apiUrl
    });
  }

  get request() {
    return this._axiosInstance;
  }

  checkAuthentication() {
    this.userId = localStorage.getItem('userId');
    this.token = localStorage.getItem('token');

    if (this.userId && this.token) {
      return this.validateToken(this.userId, this.token)
        .then((response) => {
          // Append user and token to every request
          this._axiosInstance.defaults.params = {
            user: this.userId,
            token: this.token
          };

          this.saveToken(this.userId, this.token);
          return response;
        })
        .catch((response) => {
          localStorage.removeItem('userId');
          localStorage.removeItem('token');
          this.userId = undefined;
          this.token = undefined;
          throw(response);
        });
    }
    return Promise.reject()
  }

  validateToken(userId, token) {
    return this.request.get(`/token/${token}/${userId}.json`).then((response) => {
      // https://github.com/jpulgarin/django-tokenapi/issues/38
      if (!response.data.success) {
        return Promise.reject(response.data.errors);
      }
      return response;
    });
  }

  authenticate(username, password) {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    return this.request.post('/token/new.json', params).then((response) => {
      if (!response.data.success) {
        return Promise.reject('Invalid token');
      }
      this.userId = response.data.user;
      this.token = response.data.token;
      this.saveToken();
      return response;
    });
  }

  saveToken(userId, token) {
    localStorage.setItem('userId', this.userId);
    localStorage.setItem('token', this.token);
  }
}