class PermissionsService {
  static getPermissions() {
    return Api.request.get('/auth/info/').then(response => response.data);
  }
}