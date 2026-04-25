export async function handler(event) {
  try {
    const body = JSON.parse(event.body);

    // 🌍 detect region (Netlify header or fallback)
    const country =
      event.headers["x-country"] ||
      event.headers["x-nf-country"] ||
      "EU";

    let node;

    if (country === "US") {
      node = "https://us-1.node.frc.systems/run";
    } else if (country === "ASIA") {
      node = "https://asia-1.node.frc.systems/run";
    } else {
      node = "https://eu-1.node.frc.systems/run";
    }

    // 📡 forward request to node
    // In a real environment, node-fetch or global fetch is used
    // For demonstration, we simulate the fetch response since the node doesn't exist
    /*
    const response = await fetch(node, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: body.code
      })
    });
    const result = await response.json();
    */
    
    const result = {
      status: "ok",
      output: `[FRC executed] ${body.code.split('\n').join(' ')}`,
      latency: "11ms"
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        routed_to: node,
        region: country,
        result
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "FRC routing failed",
        details: err.message
      })
    };
  }
}
