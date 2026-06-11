import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID || '',
      clientSecret: process.env.APPLE_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Phone',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const action = credentials.action === 'register' ? 'register' : 'login'
        const body: Record<string, string> = {
          phone: credentials.phone,
          password: credentials.password,
        }
        if (action === 'register' && credentials.name) body.name = credentials.name
        const res = await fetch(`${BACKEND}/auth/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Authentication failed')
        return {
          id: String(data.user.id),
          name: data.user.name,
          email: data.user.email || data.user.phone,
          image: data.user.avatar,
          backendToken: data.token,
          role: data.user.role,
          coinBalance: data.user.coin_balance,
          freeImagesUsed: data.user.free_images_used,
          phone: data.user.phone,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'apple') {
        try {
          const res = await fetch(`${BACKEND}/auth/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: account.provider,
              provider_id: account.providerAccountId,
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          })
          const data = await res.json()
          if (data.success) {
            ;(user as Record<string, unknown>).backendToken = data.token
            ;(user as Record<string, unknown>).role = data.user.role
            ;(user as Record<string, unknown>).coinBalance = data.user.coin_balance
            ;(user as Record<string, unknown>).freeImagesUsed = data.user.free_images_used
            ;(user as Record<string, unknown>).phone = data.user.phone
          }
        } catch (e) {
          console.error('OAuth sync error:', e)
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = (user as Record<string, unknown>).backendToken as string
        token.role = (user as Record<string, unknown>).role as string
        token.coinBalance = (user as Record<string, unknown>).coinBalance as number
        token.freeImagesUsed = (user as Record<string, unknown>).freeImagesUsed as number
        token.phone = (user as Record<string, unknown>).phone as string
      }
      return token
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string
      session.user.role = token.role as string
      session.user.coinBalance = token.coinBalance as number
      session.user.freeImagesUsed = token.freeImagesUsed as number
      session.user.phone = token.phone as string
      return session
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'optilogix-nextauth-secret',
})

export { handler as GET, handler as POST }
