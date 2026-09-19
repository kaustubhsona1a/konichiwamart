import app from '../server';

export default function handler(req: any, res: any) {
  const forwardedUri = req.headers['x-forwarded-uri'] || 
                       req.headers['x-original-uri'] || 
                       req.headers['x-matched-path'] || 
                       req.headers['x-vercel-matched-path'];

  if (forwardedUri && typeof forwardedUri === 'string') {
    req.url = forwardedUri;
  } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/assets')) {
    req.url = `/api${req.url}`;
  }

  return app(req, res);
}
