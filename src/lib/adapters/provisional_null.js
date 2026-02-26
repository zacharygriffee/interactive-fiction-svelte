export class NullProvisionalAdapter {
  subscribe(_cb) {
    return () => {};
  }
}
