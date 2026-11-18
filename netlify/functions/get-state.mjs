const UPSTREAM_URL = "https://server.manurobotics.com/auto_logs_2/api/get-state";
const REQUEST_BODY = JSON.stringify({
  site_id: "MAJ101",
  building_id: "D",
  wing_id: "1",
});

export default async () => {
  try {
    const response = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: REQUEST_BODY,
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to proxy get-state request:", error);
    return Response.json(
      { detail: "Unable to reach the water state service." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
};
