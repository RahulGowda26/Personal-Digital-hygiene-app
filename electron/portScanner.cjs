const net = require('net');

const COMMON_PORTS = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  135: 'RPC',
  139: 'NetBIOS',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP-Alt',
  27017: 'MongoDB'
};

async function checkPort(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'closed';

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      status = 'open';
      socket.destroy();
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', (err) => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve({ port, status, service: COMMON_PORTS[port] || 'Unknown' });
    });

    socket.connect(port, host);
  });
}

async function scanPorts(host = '127.0.0.1', portsToScan = Object.keys(COMMON_PORTS).map(Number)) {
  const results = [];
  
  // We scan in batches to avoid hitting EMFILE limits or overwhelming the OS socket table
  const batchSize = 10;
  for (let i = 0; i < portsToScan.length; i += batchSize) {
    const batch = portsToScan.slice(i, i + batchSize);
    const promises = batch.map(port => checkPort(host, port));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }
  
  return results;
}

module.exports = {
  scanPorts,
  COMMON_PORTS
};
