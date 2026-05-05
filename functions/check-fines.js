export async function onRequestPost(context) {
  try {
    const { iin, docNum, docIssueDate } = await context.request.json();

    if (!iin || !docNum || !docIssueDate) {
      return Response.json({ error: 'iin, docNum, docIssueDate required' }, { status: 400 });
    }

    const iinClean = String(iin).replace(/\D/g, '');
    const docClean = String(docNum).replace(/\D/g, '');

    // Принимаем дату в формате ДД.ММ.ГГГГ и конвертируем в ISO с +06:00
    const m = String(docIssueDate).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) {
      return Response.json({ error: 'docIssueDate must be DD.MM.YYYY' }, { status: 400 });
    }
    const isoDate = `${m[3]}-${m[2]}-${m[1]}T00:00:00+06:00`;

    const url = `https://erap-public.kgp.kz/psap/api/fine?pageNum=1&limit=10&iin=${encodeURIComponent(iinClean)}&docNum=${encodeURIComponent(docClean)}&docIssueDate=${encodeURIComponent(isoDate)}`;

    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Referer': 'https://erap-public.kgp.kz/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
      }
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return Response.json({ error: 'Upstream error', status: upstream.status, body: text.slice(0, 500) }, { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); } catch (_) {
      return Response.json({ error: 'Bad upstream JSON', body: text.slice(0, 500) }, { status: 502 });
    }

    const fines = Array.isArray(data) ? data : [];
    const unpaid = fines.filter(f => String(f.status || '').toLowerCase() !== 'оплачен');

    return Response.json({
      hasFines: unpaid.length > 0,
      fineCount: fines.length,
      unpaidCount: unpaid.length
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
