async function test() {
  const proxy = new Proxy({}, {
    get() {
      throw new Error("Synchronous error from proxy!");
    }
  });

  try {
    const x = await (proxy as any).someMethod();
    console.log("Success", x);
  } catch (e: any) {
    console.log("Caught error:", e.message);
  }
}

test();
