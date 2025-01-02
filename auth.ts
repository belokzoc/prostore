import NextAuth from "next-auth"

import { prisma } from "@/db/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import authConfig from "./auth.config"
//import {cookies} from 'next/headers'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma),
  ...authConfig,
})
