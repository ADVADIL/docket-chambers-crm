const https = require('https');

https.get('https://docket-chambers-crm.vercel.app/', (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('HTML Status:', res.statusCode);
    const m = b.match(/src="(\/assets\/[^"]+)"/);
    console.log('Script tag found:', m ? m[1] : 'NONE');
    if (m) {
      https.get('https://docket-chambers-crm.vercel.app' + m[1], (resJs) => {
        console.log('JS Status:', resJs.statusCode);
        console.log('Cache-Control header:', resJs.headers['cache-control']);
      });
    }
  });
});
