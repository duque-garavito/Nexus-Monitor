const { exec } = require('child_process');

function pingHost(ip) {
  return new Promise((resolve) => {
    console.log(`Pinging ${ip}...`);
    exec(`ping -n 1 -w 1500 ${ip}`, (error, stdout, stderr) => {
      if (error) {
        resolve({ online: false, latency: null, error: error.message });
        return;
      }
      
      const out = stdout.toLowerCase();
      console.log(`Stdout for ${ip}:\n`, stdout);
      
      const failed = out.includes('timed out') || 
                     out.includes('unreachable') || 
                     out.includes('inaccesible') ||
                     out.includes('100% loss') ||
                     out.includes('100% de p') ||
                     out.includes('perdidos = 1') ||
                     out.includes('lost = 1') ||
                     out.includes('fallo') ||
                     out.includes('failure');
      
      if (failed) {
        resolve({ online: false, latency: null });
        return;
      }

      let latency = null;
      const match = out.match(/(?:time|tiempo)[<=](\d+)\s*ms/);
      if (match && match[1]) {
        latency = parseInt(match[1]);
      }
      
      resolve({ online: true, latency });
    });
  });
}

async function run() {
  const res1 = await pingHost('8.8.8.8');
  console.log('Result for 8.8.8.8:', res1);

  const res2 = await pingHost('192.0.2.1'); // RFC 5737 Test-Net (guaranteed offline)
  console.log('Result for 192.0.2.1:', res2);
}

run();
