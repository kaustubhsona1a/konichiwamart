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
  // Ensure process.env.VERCEL is set
  process.env.VERCEL = '1';

  // 1. Resolve true request path from Vercel rewrite parameters or request url
  let targetPath = '';
  if (req.query?.path) {
    targetPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  } else if (req.query?.slug) {
    targetPath = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
  } else if (req.query?.seo) {
    targetPath = Array.isArray(req.query.seo) ? req.query.seo.join('/') : req.query.seo;
  }

  const rawUrl: string = req.url || '';
  const [basePath, search] = rawUrl.split('?');

  let cleanQuery = '';
  if (search) {
    const params = new URLSearchParams(search);
    params.delete('path');
    params.delete('slug');
    params.delete('seo');
    const q = params.toString();
    cleanQuery = q ? `?${q}` : '';
  }

  // Also clean up req.query so route handlers don't receive routing params
  if (req.query) {
    delete req.query.path;
    delete req.query.slug;
    delete req.query.seo;
  }

  if (targetPath) {
    const clean = targetPath.replace(/^\/+/, '');
    const isSeoRoute =
      clean.startsWith('products/') ||
      clean.startsWith('collections/') ||
      clean.startsWith('brands/') ||
      clean.startsWith('guides/') ||
      clean === 'about' ||
      clean === 'sitemap.xml' ||
      clean === 'robots.txt' ||
      clean === '';

    if (isSeoRoute) {
      req.url = `/${clean}${cleanQuery}`;
    } else if (clean.startsWith('api/')) {
      req.url = `/${clean}${cleanQuery}`;
    } else {
      req.url = `/api/${clean}${cleanQuery}`;
    }
  } else if (rawUrl.startsWith('/api/')) {
    req.url = rawUrl;
  } else if (rawUrl && rawUrl !== '/' && rawUrl !== '/api') {
    const cleanRaw = rawUrl.replace(/^\/+/, '');
    const isSeoRoute =
      cleanRaw.startsWith('products/') ||
      cleanRaw.startsWith('collections/') ||
      cleanRaw.startsWith('brands/') ||
      cleanRaw.startsWith('guides/') ||
      cleanRaw === 'about' ||
      cleanRaw === 'sitemap.xml' ||
      cleanRaw === 'robots.txt';

    if (isSeoRoute) {
      req.url = `/${cleanRaw}`;
    } else {
      req.url = `/api/${cleanRaw}`;
    }
  }

  const app = await getApp();
  return app(req, res);
}
