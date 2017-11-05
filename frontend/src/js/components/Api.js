class ApiService {
  constructor(apiUrl = '/') {
    this._axiosInstance = axios.create({
      baseURL: apiUrl
    });
  }

  get request() {
    return this._axiosInstance;
  }
}