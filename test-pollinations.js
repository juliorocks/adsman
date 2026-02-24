const fs = require('fs');

async function testFetch() {
    const url = `https://image.pollinations.ai/prompt/test?width=1024&height=1024&nologo=true&seed=12345&model=flux`;
    console.log("Fetching:", url);
    try {
        const res = await fetch(url, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/jpeg,image/png,image/*,*/*'
            },
            signal: AbortSignal.timeout(8000)
        });
        console.log("Status:", res.status, res.statusText);

        if (!res.ok) {
            const text = await res.text();
            console.log("Error body:", text);
            return;
        }

        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        console.log("Base64 starts with:", base64.substring(0, 50));
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

testFetch();
