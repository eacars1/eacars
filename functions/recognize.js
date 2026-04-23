export async function onRequestPost(context) {
  try {
    const apiKey = (context.env.CLAUDE_API_KEY || '').trim();

    if (!apiKey) {
      return Response.json({ error: 'CLAUDE_API_KEY environment variable is not set' }, { status: 500 });
    }

    const body = await context.request.text();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: body
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
