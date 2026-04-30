export async function GET({ url }) {
    const src = url.searchParams.get('url');
    if (!src) return new Response('missing url', { status: 400 });

    const res = await fetch(src);
    return new Response(res.body, {
        headers: {
            'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*'
        }
    });
}