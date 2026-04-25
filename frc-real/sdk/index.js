import fetch from "node-fetch";

export class FRC {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async run(model, input) {
    const res = await fetch(`${this.endpoint}/run/${model}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    return res.json();
  }
}
