'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

async function createOrGetUser(email: string, supabaseUserId: string) {
  try {
    // Try to find existing user first
    let user = await prisma.user.findUnique({
      where: { email }
    })

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: email
        }
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
    redirect('/error')
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
  redirect('/')
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
    redirect('/error')
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
  redirect('/')
}