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

    // size=50, чтобы покрыть и проверку запрета на выезд по большинству производств
    const upstream = await fetch('https://aisoip.adilet.gov.kz/rest/debtor/findErd?page=0&size=50', {
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

    const allMatches = (data && data.content) || [];
    let matches;

    if (iin) {
      const iinClean = String(iin).replace(/\D/g, '');
      matches = allMatches.filter(m => String(m.debtorIinBin || '').replace(/\D/g, '') === iinClean);
    } else {
      const target = String(fullName).trim().toUpperCase().replace(/\s+/g, ' ');
      matches = allMatches.filter(m => String(m.debtorFullName || '').trim().toUpperCase().replace(/\s+/g, ' ') === target);
    }

    const totalElements = (data.pagination && data.pagination.totalElements) || matches.length;
    const hasTravelBan = matches.some(m => m.hasTravelBan === true);

    return Response.json({
      isInRegistry: matches.length > 0 || totalElements > 0,
      totalElements,
      hasTravelBan
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
