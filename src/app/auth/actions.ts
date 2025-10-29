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
          email: email,
          currency: 'INR' // Set default currency
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

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?error=' + encodeURIComponent('Not authenticated'))
  }

  const name = formData.get('name') as string | null
  const currency = formData.get('currency') as string | null

  try {
    const updateData: { name?: string | null; currency?: string } = {}
    
    if (name !== undefined) {
      updateData.name = name === '' ? null : name.trim()
    }
    
    if (currency !== undefined) {
      const validCurrencies = ['INR', 'USD', 'EUR']
      if (!validCurrencies.includes(currency)) {
        redirect('/profile?error=' + encodeURIComponent('Invalid currency'))
      }
      updateData.currency = currency
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    })

    revalidatePath('/profile')
    redirect('/profile?success=' + encodeURIComponent('Profile updated successfully'))
  } catch (error) {
    console.error('Profile update error:', error)
    redirect('/profile?error=' + encodeURIComponent('Failed to update profile'))
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?error=' + encodeURIComponent('Not authenticated'))
  }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string

  if (!currentPassword || !newPassword) {
    redirect('/profile?error=' + encodeURIComponent('Both passwords are required'))
  }

  if (newPassword.length < 6) {
    redirect('/profile?error=' + encodeURIComponent('New password must be at least 6 characters'))
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    redirect('/profile?error=' + encodeURIComponent('Current password is incorrect'))
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    console.error('Password update error:', updateError)
    redirect('/profile?error=' + encodeURIComponent('Failed to update password'))
  }

  revalidatePath('/profile')
  redirect('/profile?success=' + encodeURIComponent('Password updated successfully'))
}