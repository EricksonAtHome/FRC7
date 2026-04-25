import fetch from "node-fetch";

export class FRC {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async run(model, input) {
    const res = await fetch(`${this.endpoint}/run/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      body: JSON.stringify({ input })
    });

    return res.json();
  }
}
