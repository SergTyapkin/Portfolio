export default class Singleton {
  static _instance;

  constructor() {
    if (Singleton._instance) {
      return Singleton._instance;
    }
    Singleton._instance = this;
  }
}
