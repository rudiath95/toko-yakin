const { exec } = require("child_process");
const path = require("path");

// Paths to your mkcert-generated certificate and key
const cert = path.join(__dirname, "localhost+2.pem");
const key = path.join(__dirname, "localhost+2-key.pem");

// HTTPS server on port 8443
const httpsCmd = `http-server ./ -p 8443 -a 0.0.0.0 --ssl --cert "${cert}" --key "${key}"`;
const httpsChild = exec(httpsCmd, { cwd: __dirname });
httpsChild.stdout.pipe(process.stdout);
httpsChild.stderr.pipe(process.stderr);

// HTTP server on port 8080
const httpCmd = `http-server ./ -p 8080 -a 0.0.0.0`;
const httpChild = exec(httpCmd, { cwd: __dirname });
httpChild.stdout.pipe(process.stdout);
httpChild.stderr.pipe(process.stderr);
