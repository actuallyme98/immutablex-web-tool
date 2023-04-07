export const delay = (timeout: number) => new Promise<void>((done) => setTimeout(done, timeout));
