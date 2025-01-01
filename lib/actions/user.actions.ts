"use server"

import { signIn, signOut } from "@/auth"
import { isRedirectError } from "next/dist/client/components/redirect"
import { signInFormSchema, signUpFormSchema } from "../validators"
import { hash } from "../encrypt"
import { prisma } from "@/db/prisma"
import { formatError } from "../utils"

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    })

    await signIn("credentials", user)

    return { success: true, message: "Signed in successfully" }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    return { success: false, message: "Invalid email or password" }
  }
}

// Sign the user out
export async function signOutUser() {
  await signOut()
}

// Register a new user
export async function signUp(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      confirmPassword: formData.get("confirmPassword"),
      password: formData.get("password"),
    })

    const plainPassword = user.password

    user.password = await hash(user.password)

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    })

    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
    })

    return { success: true, message: "User created successfully" }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    return {
      success: false,
      message: formatError(error), // Change this line
    }
  }
}
