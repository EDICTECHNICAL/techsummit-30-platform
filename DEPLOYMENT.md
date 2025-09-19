# Production Deployment Guide

## Pre-deployment Checklist

### 1. Database Setup
- [ ] Supabase project created and configured
- [ ] Database schema migrated with `npx drizzle-kit migrate`
- [ ] Admin and judge accounts seeded with `node scripts/seed-admin-judge-accounts.js`

### 2. Environment Variables
Set these in your Vercel dashboard:
```
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_secure_32_char_secret
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 3. Vercel Configuration
- [ ] Repository connected to Vercel
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install --legacy-peer-deps`

### 4. Production Testing
- [ ] Admin login works with pre-created accounts
- [ ] Real-time voting synchronization functional
- [ ] Quiz system operational
- [ ] SSE connections stable

## Post-deployment Steps

1. **Test Admin Access**:
   - Login with any admin account (admin1-admin5)
   - Verify admin console functionality
   - Test real-time voting features

2. **Test Judge Access**:
   - Login with any judge account (judge1-judge5)
   - Verify judge console access
   - Test scoring functionality

3. **Verify Real-time Features**:
   - Start a pitch cycle in admin console
   - Open voting page in another browser
   - Confirm timer synchronization works

## Monitoring & Maintenance

### Database Performance
- Monitor connection pool usage
- Check query performance
- Backup data regularly

### Real-time Features
- Monitor SSE connection stability
- Check for memory leaks in long-running connections
- Verify heartbeat functionality

### Security
- Rotate admin/judge passwords regularly
- Monitor for suspicious login attempts
- Keep dependencies updated

## Troubleshooting

### Common Issues:
1. **SSE connections failing**: Check CORS headers and Vercel function timeout
2. **Database connection errors**: Verify DATABASE_URL and connection limits
3. **Timer synchronization issues**: Check server time zones and client connectivity
4. **Build failures**: Use `--legacy-peer-deps` flag for npm install

### Support Contacts:
- Technical Issues: [Your support contact]
- Database Issues: [Your DB admin contact]
- Deployment Issues: [Your DevOps contact]