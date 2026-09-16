sed -i '/if (process.env.VERCEL) {/,/}/d' server.ts
echo 'if (!process.env.VERCEL) {' >> server.ts
echo '  startServer();' >> server.ts
echo '}' >> server.ts
echo 'export default app;' >> server.ts
