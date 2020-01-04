class ApiService {
  constructor(apiUrl = '/') {
    this._axiosInstanceApi = axios.create({
      baseURL: apiUrl
    });

    this._axiosInstanceFiles = axios.create();
  }

  get request() {
    return this._axiosInstanceApi;
  }

  get fileRequest() {
    // Static files rest in a different location
    return this._axiosInstanceFiles;
  }
}