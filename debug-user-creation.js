// DEBUG SCRIPT - Run this in browser console to test user creation
// Make sure you're logged in as admin first

async function debugUserCreation() {
  console.log('🔍 Starting user creation debug...')

  // Test 1: Check current session
  const { data: session } = await supabase.auth.getSession()
  console.log('Current session:', !!session.session, session.session?.user?.id)

  // Test 2: Check user table access
  console.log('🔍 Testing user table access...')
  const { data: users, error: readError } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(5)

  console.log('Read users result:', { count: users?.length, error: readError?.message })

  // Test 3: Check groups table
  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('*')

  console.log('Groups available:', groups?.length, groups)

  // Test 4: Try creating a test auth user (will be cleaned up)
  console.log('🔍 Testing auth user creation...')
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TempPassword123!'

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test User',
        role: 'star_player',
      }
    }
  })

  console.log('Auth creation result:', {
    success: !!authData.user,
    userId: authData.user?.id,
    error: authError?.message
  })

  if (authData.user) {
    // Test 5: Try creating profile
    console.log('🔍 Testing profile creation...')

    const profileData = {
      id: authData.user.id,
      email: testEmail,
      full_name: 'Test User',
      role: 'star_player',
      group_id: 1,
    }

    const { data: profileResult, error: profileError } = await supabase
      .from('users')
      .insert(profileData)
      .select()

    console.log('Profile creation result:', {
      success: !!profileResult,
      error: profileError?.message,
      code: profileError?.code,
      details: profileError?.details
    })

    // Clean up - sign out the test user
    await supabase.auth.signOut()
    console.log('✅ Test user signed out')

    if (profileResult) {
      console.log('✅ User creation test PASSED')
    } else {
      console.error('❌ User creation test FAILED:', profileError)
    }
  } else {
    console.error('❌ Auth creation test FAILED:', authError)
  }

  console.log('🔍 Debug complete')
}

// Run the debug
debugUserCreation().catch(console.error)