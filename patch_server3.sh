sed -i '/startServer();/d' server.ts
sed -i '/if (!process.env.VERCEL) {/d' server.ts
sed -i '/export default app;/d' server.ts
sed -i '/^}$/d' server.ts
