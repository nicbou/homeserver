class PermissionsService {
  constructor(endpoint){
    this.permissionRequest = axios.get(endpoint);
  }

  waitForPermissions() {
    return this.permissionRequest.then(response => response.data);
  }

  checkPermission(permission) {
    return this.waitForPermissions().then((data) => {
        return data.isAdmin || data.permissions.includes(permission);
    })
  }
}