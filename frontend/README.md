# URLshort

Dashboard for creating and managing shortened URLs.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run build` writes a static `dist/` folder. The app does not need a Node server at runtime.

## Deployment

Terraform creates a private S3 bucket and a CloudFront distribution that rewrites 403 and 404 to `200 /index.html`. GitHub Actions builds this app with `VITE_API_BASE_URL` set to the `api_invoke_url` output, syncs `dist/` to the bucket, and invalidates the distribution. See `terraform/README.md`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run test:run`
- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
