  import { compare } from './lib/encrypt';
  import type { NextAuthConfig } from "next-auth"
  import CredentialsProvider from "next-auth/providers/credentials"
  import { prisma } from "@/db/prisma"

  //import {cookies} from 'next/headers'
  import {NextResponse} from 'next/server'

  export default {
    pages: {
      signIn: "/sign-in",
      error: "/sign-in",
    },
    providers: [
      CredentialsProvider({
        credentials: {
          email: {
            type: "email",
          },
          password: { type: "password" },
        },
        async authorize(credentials) {
          if (credentials == null) return null
          
          // Find user in database
          const user = await prisma.user.findFirst({
            where: {
              email: credentials.email as string,
            },
          })
          // Check if user exists and password is correct
          if (user && user.password) {
            const isMatch = await compare(
              credentials.password as string,
              user.password
            );
            // If password is correct, return user object
            if (isMatch) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            }
          }

          // If user doesn't exist or password is incorrect, return null
          return null
        },
      }),
    ],
    callbacks: {
      async session({ session, user, trigger, token }: any) {
        //set user ID from the token, token.sub is the user ID
        session.user.id = token.sub
        session.user.name = token.name; 
        session.user.role = token.role; 

        if (trigger === "update") {
          session.user.name = user.name
        }
        return session
      },
      async jwt({ token, user, trigger, session }: any) {
        // Assign user fields to token
        if (user) {
          token.role = user.role;

          // If user has no name, use email as their default name
          if (user.name === 'NO_NAME') {
            token.name = user.email!.split('@')[0];

            // Update the user in the database with the new name
            await prisma.user.update({
              where: { id: user.id },
              data: { name: token.name },
            });
          }
        }

        // Handle session updates (e.g., name change)
        if (session?.user.name && trigger === 'update') {
          token.name = session.user.name;
        }

        return token;
      },
      authorized({ request, auth }: any) {
        // Array of regex patterns of paths we want to protect
        const protectedPaths = [
          /\/shipping-address/,
          /\/payment-method/,
          /\/place-order/,
          /\/profile/,
          /\/user\/(.*)/,
          /\/order\/(.*)/,
          /\/admin/,
        ];
  
        // Get pathname from the req URL object
        const { pathname } = request.nextUrl;
  
        // Check if user is not authenticated and accessing a protected path
        if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;


  
       // Check for session cart cookie
        if (!request.cookies.get('sessionCartId')) {
          // Generate new session cart id cookie
          const sessionCartId = crypto.randomUUID();
  
          // Clone the req headers
          const newRequestHeaders = new Headers(request.headers);
  
          // Create new response and add the new headers
          const response = NextResponse.next({
            request: {
              headers: newRequestHeaders,
            },
          });
  
          // Set newly generated sessionCartId in the response cookies
          response.cookies.set('sessionCartId', sessionCartId);
  
          return response;
        } else {
          return true;
        }
      },
    },
  } satisfies NextAuthConfig

