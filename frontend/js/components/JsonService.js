class JsonService {
  request(url, method) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(xhr.responseText);
          }
        }
      };
      xhr.open(method, url);
      xhr.send();
    });
  }

  get(url) {
    return this.request(url, 'GET');
  }

  post(url) {
    return this.request(url, 'POST');
  }

  getJson(url) {
    return new Promise((resolve, reject) => {
      this.get(url).then(
        (responseText) => {
          resolve(JSON.parse(responseText))
        },
        (responseText) => {
          reject(JSON.parse(responseText))
        }
      );
    });
  }

  postJson(url) {
    return new Promise((resolve, reject) => {
      this.post(url).then(
        (responseText) => {
          resolve(JSON.parse(responseText))
        },
        (responseText) => {
          reject(JSON.parse(responseText))
        }
      );
    });
  }
}