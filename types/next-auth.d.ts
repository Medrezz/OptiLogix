import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    backendToken?: string
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      coinBalance?: number
      freeImagesUsed?: number
      phone?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string
    role?: string
    coinBalance?: number
    freeImagesUsed?: number
    phone?: string
  }
}
