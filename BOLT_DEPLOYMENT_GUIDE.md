# Bolt.new Hosting Guide

This project is optimized for deployment on **Bolt.new** - StackBlitz's WebContainer-based hosting platform.

## Why Bolt.new?

Bolt.new provides instant, zero-configuration deployments that run entirely in WebContainers. Your application is already configured with all the necessary optimizations for this environment.

## Pre-Configured Optimizations

Your `next.config.js` includes these Bolt.new-specific settings:

```javascript
webpack: (config, { isServer }) => {
  config.parallelism = 1; // WebContainer compatibility
  return config;
},
experimental: {
  workerThreads: false,
  cpus: 1
},
cache: false // Ensures fresh builds
```

## Deployment Process

### Option 1: Direct Deployment (Recommended)

1. **Open in Bolt.new:**
   - Click the "Deploy" or "Publish" button in the Bolt.new interface
   - Bolt.new will automatically build and host your application

2. **Automatic Features:**
   - Instant SSL/HTTPS
   - Auto-scaling
   - CDN distribution
   - Real-time updates on code changes

### Option 2: GitHub Integration

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Bolt.new deployment"
   git push origin main
   ```

2. **Import to Bolt.new:**
   - Visit [bolt.new](https://bolt.new)
   - Click "Import from GitHub"
   - Select your repository
   - Bolt.new will auto-detect Next.js and deploy

## Environment Variables

Your project uses Supabase. Ensure these environment variables are configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Setting Environment Variables in Bolt.new:**
1. Click on "Settings" or "Environment" in the Bolt.new interface
2. Add each variable from your `.env` file
3. Redeploy for changes to take effect

## Build Commands

Bolt.new automatically detects Next.js projects. Default commands:

- **Build:** `npm run build`
- **Start:** `npm start`
- **Dev:** `npm run dev` (for development mode)

## Post-Deployment Checklist

After deployment, verify:

- [ ] Application loads correctly
- [ ] Supabase connection works (check authentication)
- [ ] All environment variables are set
- [ ] Edge Functions are accessible (if using)
- [ ] Static assets (images, PDFs) are loading
- [ ] Service Worker registers properly
- [ ] PWA functionality works (if applicable)

## Troubleshooting

### Build Fails

**Issue:** Webpack errors or memory issues
**Solution:** Your config already limits parallelism. If issues persist:
```bash
npm run build -- --max-old-space-size=4096
```

### Environment Variables Not Working

**Issue:** `undefined` errors for env variables
**Solution:**
- Ensure all variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding variables
- Clear browser cache

### Supabase Connection Errors

**Issue:** CORS or connection refused
**Solution:**
1. Verify Supabase URL in environment variables
2. Check Supabase project is active
3. Verify API keys are correct
4. Check RLS policies allow public access where needed

## Performance Optimization

Your app is already optimized with:

- ✅ WebContainer-compatible webpack config
- ✅ Disabled worker threads for compatibility
- ✅ Single CPU processing
- ✅ Cache disabled for fresh builds
- ✅ WASM SWC compiler for faster builds

## Monitoring & Analytics

Monitor your deployed app:

1. **Bolt.new Dashboard:** View deployment logs and build status
2. **Supabase Dashboard:** Monitor database queries and API usage
3. **Browser DevTools:** Check for console errors or network issues

## Updating Your Deployment

### Method 1: Direct Edit in Bolt.new
- Edit files directly in the Bolt.new interface
- Changes are auto-deployed

### Method 2: Git Push
```bash
git add .
git commit -m "Update feature"
git push origin main
```
Bolt.new will automatically redeploy on push (if GitHub integration is enabled).

## Custom Domain (Optional)

To use a custom domain with Bolt.new:

1. Configure DNS settings to point to Bolt.new servers
2. Follow Bolt.new's custom domain setup instructions
3. SSL certificates are automatically provisioned

## Rollback

If a deployment fails:

1. Go to Bolt.new deployment history
2. Select a previous working version
3. Click "Restore" or "Redeploy"

## Support Resources

- **Bolt.new Documentation:** [docs.bolt.new](https://docs.bolt.new)
- **StackBlitz Blog:** Latest updates and features
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

## Architecture Notes

This is a Next.js 13 application with:
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Backend:** Supabase (Database + Auth + Edge Functions)
- **Hosting:** Bolt.new (WebContainer environment)

All native dependencies have been replaced with JavaScript/WASM alternatives for WebContainer compatibility.

---

**Your app is production-ready for Bolt.new hosting!**

For questions or issues, check the Bolt.new console logs and Supabase dashboard for detailed error messages.
