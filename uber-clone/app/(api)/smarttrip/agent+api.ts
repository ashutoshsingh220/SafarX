import { runAgent } from "../../../backend/smarttrip/agent/agent";

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    
    // In a real app we'd retrieve user session context here
    const res = await runAgent(history || [], message);
    
    return Response.json({ data: { reply: res.text, history: res.history } });
  } catch (error: any) {
    console.error("Agent API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
