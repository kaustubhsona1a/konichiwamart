export const config = {
  api: {
    bodyParser: false,
  },
};

let appHandler: any = null;

async function getApp() {
  if (!appHandler) {
    process.env.VERCEL = '1';
    try {
      // First try pre-bundled CommonJS server
      // @ts-ignore
      const serverModule = await import('../dist/server.cjs');
      appHandler = serverModule.default?.default || serverModule.default || serverModule;
    } catch (bundleErr) {
      // Fallback to TS source
      // @ts-ignore
      const serverModule: any = await import('../server.ts');
      appHandler = serverModule.default?.default || serverModule.default || serverModule;
    }
  }
  return appHandler;
}

export default async function handler(req: any, res: any) {
  const forwardedUri = req.headers['x-forwarded-uri'] || 
                       req.headers['x-original-uri'] || 
                       req.headers['x-matched-path'] || 
                       req.headers['x-vercel-matched-path'] ||
                       req.headers['x-invoke-path'];

  if (forwardedUri && typeof forwardedUri === 'string') {
    req.url = forwardedUri;
  } else if (req.query?.slug) {
    const slugPath = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
    req.url = `/api/${slugPath}`;
  } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/assets')) {
    req.url = `/api${req.url}`;
  }

  const app = await getApp();
  return app(req, res);
}

