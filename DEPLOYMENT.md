# Vercel Deployment Setup

This project uses GitHub Actions to automatically deploy to Vercel when you push to `main` or `master`.

## Initial Setup (One-time)

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (run from project root)
vercel link
```

This creates a `.vercel` folder with your project config. Note down:
- **Org ID** (shown during linking, or in `.vercel/project.json`)
- **Project ID** (in `.vercel/project.json`)

### 2. Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Create a new token with a descriptive name (e.g., "GitHub Actions")
3. Copy the token (you won't see it again)

### 3. Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these three secrets:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | Your Vercel token from step 2 |
| `VERCEL_ORG_ID` | Your Org ID from step 1 |
| `VERCEL_PROJECT_ID` | Your Project ID from step 1 |

### 4. Push and Deploy!

```bash
git add .
git commit -m "Add Vercel deployment"
git push origin main
```

The GitHub Action will automatically:
- Build your project
- Deploy to Vercel production (on push to main/master)
- Deploy preview builds (on pull requests)

## How It Works

- **Push to main/master** → Production deployment
- **Pull request** → Preview deployment (unique URL for each PR)

## Manual Deployment

You can also deploy manually:

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Troubleshooting

### "Project not found" error
Make sure `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct. You can find them in:
- `.vercel/project.json` after running `vercel link`
- Vercel dashboard → Project Settings → General

### Build fails
Check that your build works locally first:
```bash
npm run build
```

### Secrets not working
- Ensure secret names match exactly (case-sensitive)
- Check that secrets are added to the correct repo
- Secrets are not available in forks for security reasons
