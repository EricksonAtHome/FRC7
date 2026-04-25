export async function handler(event) {
  // Parse incoming request
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // Simulate Geo Detection (Netlify provides 'x-country' header in prod)
  // For local dev, we default to EU or randomly assign if testing
  const country = event.headers["x-country"] || "EU";
  let node = "";
  let region = "";

  if (["NL", "DE", "FR", "EU"].includes(country)) {
    node = "https://eu-1.node.frc.systems/run";
    region = "EU-Central";
  } else if (["US", "CA"].includes(country)) {
    node = "https://us-1.node.frc.systems/run";
    region = "US-East";
  } else {
    node = "https://asia-1.node.frc.systems/run";
    region = "Asia-Pacific";
  }

  // In a real scenario we use fetch() to send the payload to the actual node.
  // Since eu-1.node.frc.systems is conceptual, we will mock the AI execution 
  // response to demonstrate the routing logic perfectly.
  
  const mockResult = {
    status: "ok",
    output: `[FRC executed] ${body.code.split('\n')[0]}`,
    latency: Math.floor(Math.random() * 20 + 8) + "ms",
    node_id: node.split('/')[2]
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      gateway: "Netlify Smart Router",
      detected_region: region,
      routed_to: node,
      result: mockResult
    })
  };
}
