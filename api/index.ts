import app from '../server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: any) {
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

  return app(req, res);
}
