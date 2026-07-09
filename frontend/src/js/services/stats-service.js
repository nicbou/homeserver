export default class {
  static getDiskSpace() {
    return fetch('/api/system/').then(r => r.json());
  }
}
