export async function onRequestPost(context) {
  try {
    const token = (context.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (context.env.TELEGRAM_CHAT_ID || '').trim();

    if (!token || !chatId) {
      return Response.json({ error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set' }, { status: 500 });
    }

    const action = context.params.action;
    if (action !== 'sendMessage' && action !== 'sendDocument') {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const tgUrl = 'https://api.telegram.org/bot' + token + '/' + action;
    const contentType = context.request.headers.get('content-type') || '';

    let tgResponse;
    if (contentType.includes('application/json')) {
      const body = await context.request.json();
      body.chat_id = chatId;
      tgResponse = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else if (contentType.includes('multipart/form-data')) {
      const fd = await context.request.formData();
      fd.set('chat_id', chatId);
      tgResponse = await fetch(tgUrl, { method: 'POST', body: fd });
    } else {
      return Response.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    const text = await tgResponse.text();
    return new Response(text, {
      status: tgResponse.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
