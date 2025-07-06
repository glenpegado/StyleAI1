# peacedrobe

AI-Powered Fashion Styling Platform

## 🎯 About

peacedrobe is an AI-powered fashion styling platform that helps users discover celebrity styles and get personalized outfit recommendations. Built with Next.js, Supabase, and OpenAI, it provides a seamless experience for fashion enthusiasts to explore trending styles and find real products.

## ✨ Features

- **AI-Powered Outfit Generation**: Get personalized outfit suggestions based on your style preferences
- **Celebrity Style Discovery**: Explore trending celebrity looks and fashion inspiration
- **Real Product Integration**: Find actual products from major retailers with affiliate links
- **Style Image Gallery**: Browse fashion inspiration from various sources
- **User Authentication**: Secure sign-up and sign-in with Supabase Auth
- **Favorites System**: Save and organize your favorite looks
- **Responsive Design**: Beautiful UI that works on all devices

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI**: OpenAI GPT-4, Picaos API
- **Product Data**: ShopStyle API, Affiliate Networks
- **Deployment**: Vercel

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/glenpegado/peacedrobe.git
cd peacedrobe
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Picaos API
PICA_SECRET_KEY=your_pica_secret_key
PICA_OPENAI_CONNECTION_KEY=your_pica_connection_key

# ShopStyle API
SHOPSTYLE_API_KEY=your_shopstyle_api_key

# Google Custom Search
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup

1. Set up your Supabase project
2. Run the migrations in the `supabase/migrations/` folder
3. Configure your database schema for saved looks and user data

## 🔧 Configuration

### Google Custom Search API
1. Create a Google Custom Search Engine
2. Configure it for fashion sites: `*.vogue.com, *.pinterest.com, *.grailed.com, *.hypebeast.com, *.complex.com`
3. Name it "peacedrobe Fashion Search"
4. Copy your Search Engine ID (cx)

### ShopStyle API
1. Sign up for ShopStyle API access
2. Get your API key from the dashboard
3. Configure affiliate network settings

## 📚 Documentation

- [Product Integration Guide](./PRODUCT_INTEGRATION_GUIDE.md)
- [Affiliate Integration Guide](./AFFILIATE_INTEGRATION_GUIDE.md)
- [Setup Guide](./SETUP_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI capabilities by [OpenAI](https://openai.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

Made with ❤️ by the peacedrobe team
