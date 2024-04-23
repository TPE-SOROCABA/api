
export abstract class JsonHandler {
  static parse<T>(json?: string): T {
    if (!json) {
        throw new Error("Invalid JSON");
    }
    try {
        return JSON.parse(json);
    } catch (error) {
        throw new Error("Invalid JSON");
    }
  }
}