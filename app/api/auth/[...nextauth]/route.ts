// import { NextAuthOptions } from 'next-auth'
// import CredentialsProvider from 'next-auth/providers/credentials'
// import { PrismaAdapter } from '@auth/prisma-adapter'
// import { PrismaClient } from '@prisma/client'
// import bcrypt from 'bcryptjs'

// const prisma = new PrismaClient()

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     CredentialsProvider({
//       name: 'credentials',
//       credentials: {
//         email: { label: 'Email', type: 'email' },
//         password: { label: 'Password', type: 'password' },
//         role: { label: 'Role', type: 'text' },
//         rpps: { label: 'RPPS', type: 'text' },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error('Email et mot de passe requis')
//         }

//         const user = await prisma.user.findUnique({
//           where: {
//             email: credentials.email,
//           },
//         })

//         if (!user) {
//           throw new Error('Utilisateur non trouvé')
//         }

//         const isPasswordValid = await bcrypt.compare(
//           credentials.password,
//           user.password
//         )

//         if (!isPasswordValid) {
//           throw new Error('Mot de passe incorrect')
//         }

//         if (user.role === 'MEDECIN' && credentials.rpps) {
//           if (user.rppsNumber !== credentials.rpps) {
//             throw new Error('Numéro RPPS incorrect')
//           }
//         }

//         return {
//           id: user.id,
//           email: user.email,
//           role: user.role,
//         }
//       },
//     }),
//   ],
//   session: {
//     strategy: 'jwt',
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         return {
//           ...token,
//           id: (user as any).id,      // ✅ Corrigé pour éviter l'erreur TS
//           role: (user as any).role,
//         }
//       }
//       return token
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         (session.user as any).id = (token as any).id  // ✅ Corrigé également
//         (session.user as any).role = (token as any).role
//       }
//       return session
//     },
//   },
//   pages: {
//     signIn: '/auth/login',
//     newUser: '/auth/register',
//   },
// }

// export const handler = authOptions
