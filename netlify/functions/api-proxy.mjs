const ENDPOINTS = {
  "get-state": {
    url: "https://server.manurobotics.com/auto_logs_2/api/get-state",
    body: JSON.stringify({ site_id: "MAJ101", building_id: "D", wing_id: "1" }),
  },
};

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  const endpoint = event.queryStringParameters?.endpoint ?? "get-state";
  const target = Object.hasOwn(ENDPOINTS, endpoint) ? ENDPOINTS[endpoint] : null;
  if (!target) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ detail: "Unknown API endpoint." }),
    };
  }

  try {
    const response = await fetch(target.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: target.body,
    });
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        ...(response.headers.get("content-type")
          ? { "Content-Type": response.headers.get("content-type") }
          : {}),
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
