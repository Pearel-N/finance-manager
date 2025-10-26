'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

async function createOrGetUser(email: string, supabaseUserId: string) {
  try {
    // Try to find existing user first by email
    let user = await prisma.user.findUnique({
      where: { email }
    })

    // If user doesn't exist, create them with the Supabase user ID
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: supabaseUserId, // Use Supabase user ID as our user ID
          email: email
        }
      })
    } else if (user.id !== supabaseUserId) {
      // If user exists but with different ID, update the ID to match Supabase
      user = await prisma.user.update({
        where: { email },
        data: { id: supabaseUserId }
      })
    }

    return user
  } catch (error) {
    console.error('Error creating/getting user:', error)
    throw error
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    redirect('/auth/login?error=' + encodeURIComponent(error.message))
  }

  // Create or get user in our database
  if (authData.user) {
    try {
      await createOrGetUser(authData.user.email!, authData.user.id)
    } catch (error) {
      console.error('Failed to create/get user:', error)
      // Continue with login even if user creation fails
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error)
    redirect('/auth/signup?error=' + encodeURIComponent(error.message))
  }

  // Create user in our database
  if (authData.user) {
    try {
      await createOrGetUser(authData.user.email!, authData.user.id)
    } catch (error) {
      console.error('Failed to create user:', error)
      // Continue with signup even if user creation fails
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Logout error:', error)
    redirect('/?error=' + encodeURIComponent(error.message))
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}