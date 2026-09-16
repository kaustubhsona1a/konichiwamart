const fs = require('fs');

let content = fs.readFileSync('src/lib/razorpay.ts', 'utf8');
content = content.replace(/rzp_live_Tcn0IlOcwCPgU3/g, 'rzp_live_Tcn0IIOcwCPgU3');
fs.writeFileSync('src/lib/razorpay.ts', content);

let serverContent = fs.readFileSync('server.ts', 'utf8');
serverContent = serverContent.replace(/rzp_live_Tcn0IlOcwCPgU3/g, 'rzp_live_Tcn0IIOcwCPgU3');
fs.writeFileSync('server.ts', serverContent);

let osContent = fs.readFileSync('src/lib/orderService.ts', 'utf8');
osContent = osContent.replace(/rzp_live_Tcn0IlOcwCPgU3/g, 'rzp_live_Tcn0IIOcwCPgU3');
fs.writeFileSync('src/lib/orderService.ts', osContent);
