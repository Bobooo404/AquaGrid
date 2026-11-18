const ENDPOINTS = {
  "get-state": "https://server.manurobotics.com/auto_logs_2/api/get-state",
  get_refill_mode: "https://server.manurobotics.com/auto_logs/get_refill_mode",
  get_sensor_level: "https://server.manurobotics.com/auto_logs/get_sensor_level",
};

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  const endpoint = event.queryStringParameters?.endpoint;
  const url = Object.hasOwn(ENDPOINTS, endpoint) ? ENDPOINTS[endpoint] : null;
  if (!url) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ detail: "Unknown API endpoint." }),
    };
  }

  try {
    const method = endpoint === "get-state" ? "POST" : (event.httpMethod ?? "GET");
    const body = endpoint === "get-state"
      ? JSON.stringify({ site_id: "MAJ101", building_id: "D", wing_id: "1" })
      : (method === "GET" ? undefined : (event.body ?? "{}"));
    const response = await fetch(url, {
      method,
      headers: method === "GET" ? undefined : { "Content-Type": "application/json" },
      body,
    });

    const upstreamContentType = response.headers.get("content-type");
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        ...(upstreamContentType ? { "Content-Type": upstreamContentType } : {}),
      },
      body: await response.text(),
    };
  } catch (error) {
    console.error("Failed to proxy API request:", error);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ detail: "Unable to reach the water state service." }),
    };
  }
};
