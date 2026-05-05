export async function onRequestPost(context) {
  try {
    const { iin, fullName } = await context.request.json();

    if (!iin && !fullName) {
      return Response.json({ error: 'iin or fullName required' }, { status: 400 });
    }

    const payload = {
      iin: iin || '',
      fullName: fullName || '',
      searchType: 0,
      action: 'findErd',
      captcha: ''
    };

    const upstream = await fetch('https://aisoip.adilet.gov.kz/rest/debtor/findErd?page=0&size=10', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ru',
        'Origin': 'https://aisoip.adilet.gov.kz',
        'Referer': 'https://aisoip.adilet.gov.kz/debtors',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return Response.json({ error: 'Upstream error', status: upstream.status, body: text.slice(0, 500) }, { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); } catch (_) {
      return Response.json({ error: 'Bad upstream JSON', body: text.slice(0, 500) }, { status: 502 });
    }

    const matches = (data && data.content) || [];
    let isDebtor = false;

    if (iin) {
      const iinClean = String(iin).replace(/\D/g, '');
      isDebtor = matches.some(m => String(m.debtorIinBin || '').replace(/\D/g, '') === iinClean);
    } else {
      const target = String(fullName).trim().toUpperCase().replace(/\s+/g, ' ');
      isDebtor = matches.some(m => String(m.debtorFullName || '').trim().toUpperCase().replace(/\s+/g, ' ') === target);
    }

    return Response.json({
      isDebtor,
      totalElements: (data.pagination && data.pagination.totalElements) || matches.length,
      matchCount: matches.length
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
