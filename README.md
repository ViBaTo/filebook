This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Create a `.env.local` file before running the app:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Email setup

Transactional emails use Resend with two sender identities configured in
`lib/email/client.ts`:

- Auth emails: `FlipBook by VIBATO <noreply@vibato.io>`
- Product emails: `FlipBook by VIBATO <hello@vibato.io>`

Before using email flows in production:

- Verify `vibato.io` in Resend
- Set `RESEND_API_KEY` in local and Railway
- Set `SUPABASE_SERVICE_ROLE_KEY` so the custom auth flow can generate secure
  signup and recovery links
- Keep `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` aligned to the same
  public origin to avoid mismatches between email links, OAuth redirects and
  Stripe redirects

Auth emails are sent through the custom Resend flow in `lib/email/auth.ts`,
not through Supabase's default hosted email templates.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
