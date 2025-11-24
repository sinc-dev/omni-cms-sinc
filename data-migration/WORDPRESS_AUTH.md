# WordPress Authentication

## Credentials

WordPress credentials are stored in `.env.wordpress-auth` (not committed to git).

**Username**: `scrape-assist`  
**Password**: `X@$T06nzmZM%Xyz%l5p3IHSf`

These credentials are used for HTTP Basic Authentication when accessing WordPress REST API endpoints.

## Usage

All scraping and exploration scripts automatically load credentials from `.env.wordpress-auth`:

```bash
# Credentials are automatically loaded
node scripts/explore-wordpress-sites.js
node scripts/analyze-sample-data.js
node organizations/study-in-kazakhstan/scripts/scrape.js
```

## Security

⚠️ **Important**:
- The `.env.wordpress-auth` file is in `.gitignore`
- Never commit WordPress credentials to git
- Keep these credentials secure
- If compromised, change the WordPress password immediately

## How It Works

Scripts use HTTP Basic Authentication:
```
Authorization: Basic base64(username:password)
```

This allows access to:
- Protected WordPress REST API endpoints
- Custom post types that require authentication
- Media endpoints
- User data

## Testing Authentication

You can test if authentication works:

```bash
# Test with curl
curl -u scrape-assist:"X@$T06nzmZM%Xyz%l5p3IHSf" \
  https://studyinkzk.com/wp-json/wp/v2/posts?per_page=1
```

If you get a 401 Unauthorized error, the credentials may be incorrect or the endpoint doesn't require authentication.

