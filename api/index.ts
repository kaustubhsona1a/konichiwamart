process.env.VERCEL = '1';

export const config = {
  api: {
    bodyParser: false,
  },
};

let appHandler: any = null;

async function getApp() {
  if (!appHandler) {
    try {
      // Use pre-bundled server
      // @ts-ignore
      const serverModule = await import('../dist/server.cjs');
      appHandler = serverModule.default?.default || serverModule.default || serverModule;
    } catch {
      // Direct source fallback
      // @ts-ignore
      const serverModule: any = await import('../server.ts');
      appHandler = serverModule.default?.default || serverModule.default || serverModule;
    }
  }
  return appHandler;
}

export default async function handler(req: any, res: any) {
  // 1. Resolve true request path from Vercel rewrite parameters or request url
  let targetPath = '';
  if (req.query?.path) {
    targetPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  } else if (req.query?.slug) {
    targetPath = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
  }

  const rawUrl: string = req.url || '';
  const [basePath, search] = rawUrl.split('?');

  if (targetPath) {
    if (search) {
      const params = new URLSearchParams(search);
      params.delete('path');
      params.delete('slug');
      const cleanQuery = params.toString();
      req.url = `/api/${targetPath.replace(/^\/+/, '')}${cleanQuery ? `?${cleanQuery}` : ''}`;
    } else {
      req.url = `/api/${targetPath.replace(/^\/+/, '')}`;
    }
  } else if (rawUrl.startsWith('/api/')) {
    // Already has full API path (e.g. /api/customer/register, /api/admin/orders)
    req.url = rawUrl;
  } else if (rawUrl && rawUrl !== '/' && rawUrl !== '/api') {
    // Relative path without /api prefix
    req.url = `/api${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }

  // Ensure process.env.VERCEL is set
  process.env.VERCEL = '1';

  const app = await getApp();
  return app(req, res);
}
