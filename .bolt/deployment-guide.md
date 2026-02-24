# 🚀 Bolt.new Deployment Guide - luathoachat.vn

## ✅ Fix Applied: Netlify Conflict Resolved

### Changes Made:
1. ✅ Disabled `netlify.toml` (renamed to `netlify.toml.disabled`)
2. ✅ Removed `@netlify/plugin-nextjs` from package.json
3. ✅ Created Bolt-specific configuration in `.bolt/config.json`
4. ✅ Updated `.gitignore` to exclude deployment configs

---

## 📋 Deployment Steps

### Step 1: Environment Variables Setup
In Bolt.new Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzMTQ1NzMsImV4cCI6MjA1Mzg5MDU3M30.3r7iS7yyl4T54Vn8jXO-YaGCPebnxcZtDbp0OL7gZxU
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build Project
```bash
npm run build
```

### Step 4: Deploy
Click "Deploy" button in Bolt.new interface.

---

## 🌐 Custom Domain Setup (luathoachat.vn)

### In Bolt.new Dashboard:
1. Go to Settings → Domains
2. Click "Add Custom Domain"
3. Enter: `luathoachat.vn`
4. Add: `www.luathoachat.vn`
5. Copy the DNS records provided

### DNS Configuration (at your domain provider):

#### If using Cloudflare:
```
Type: A
Name: @
Value: [IP from Bolt.new]
Proxy: ON
TTL: Auto

Type: CNAME
Name: www
Value: [your-project].bolt.new
Proxy: ON
TTL: Auto
```

#### If using GoDaddy/Namecheap:
```
Type: A
Host: @
Points to: [IP from Bolt.new]
TTL: 600

Type: CNAME
Host: www
Points to: [your-project].bolt.new
TTL: 3600
```

### SSL Certificate:
- Automatically issued by Bolt.new after DNS propagation
- Wait 15-30 minutes after DNS is active
- Verify at: https://www.ssllabs.com/ssltest/

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] https://luathoachat.vn loads successfully
- [ ] SSL certificate is active (green padlock)
- [ ] Chat AI interface works
- [ ] Mobile responsive (test on phone)
- [ ] No console errors (F12 → Console)
- [ ] All images/assets load
- [ ] Supabase connection works

---

## 🔧 Troubleshooting

### Issue: "ChunkLoadError" in browser
**Solution:** Clear browser cache (Ctrl+Shift+Delete)

### Issue: DNS not resolving
**Solution:**
- Verify DNS records at https://dnschecker.org
- Wait 1-2 hours for propagation
- Flush local DNS: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Issue: Blank page after deploy
**Solution:**
- Check environment variables are set correctly
- Verify build completed without errors
- Check browser console for errors

### Issue: API calls failing
**Solution:**
- Verify Supabase credentials
- Check CORS settings in Supabase dashboard
- Ensure RLS policies allow anonymous access where needed

---

## 📊 Performance Optimization

Post-deployment optimizations:

1. **Enable Cloudflare CDN** (if using Cloudflare DNS)
   - Automatic caching of static assets
   - DDoS protection

2. **Monitor Performance**
   - Google PageSpeed Insights: https://pagespeed.web.dev/
   - Target: Score > 80

3. **SEO Verification**
   - Google Search Console
   - Submit sitemap: https://luathoachat.vn/sitemap.xml

---

## 📞 Support

If deployment fails, check:
1. Build logs in Bolt.new
2. Browser console errors
3. Network tab for failed requests
4. Supabase logs for database errors

---

**Deployment Date:** 2026-02-24
**Platform:** Bolt.new Native Hosting
**Framework:** Next.js 13.5.1
**Domain:** luathoachat.vn
