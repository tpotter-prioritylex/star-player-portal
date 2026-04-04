// Test script to verify the rebuilt user creation flow
// Run this in browser console while logged in as admin
// This tests the specific session preservation fix

async function testUserCreationFlow() {
  console.log('🧪 Testing rebuilt user creation flow...')

  // Step 1: Verify we start as admin
  const { data: { session: initialSession } } = await supabase.auth.getSession()

  if (!initialSession) {
    console.error('❌ No admin session found - please log in first')
    return
  }

  const adminUserId = initialSession.user.id
  const adminEmail = initialSession.user.email
  console.log('✅ Starting as admin:', adminEmail, adminUserId)

  // Step 2: Test creating a user using our rebuilt function
  const testUserData = {
    email: `test-${Date.now()}@example.com`,
    full_name: 'Test User Session Fix',
    role: 'star_player',
    group_id: 1,
    temporary_password: 'TempPassword123!'
  }

  console.log('📧 Testing user creation with data:', testUserData)

  try {
    // Import and call our rebuilt createUser function
    // This should preserve the admin session throughout
    const result = await createUser(testUserData)

    if (result.error) {
      console.error('❌ User creation failed:', result.error.message)
      return
    }

    console.log('✅ User creation completed:', result.data)

    // Step 3: CRITICAL TEST - Verify admin session is still active
    const { data: { session: finalSession } } = await supabase.auth.getSession()

    if (!finalSession) {
      console.error('❌ CRITICAL: No session after user creation!')
      return
    }

    const finalUserId = finalSession.user.id
    const finalEmail = finalSession.user.email

    console.log('🔍 Final session:', finalEmail, finalUserId)

    if (finalUserId === adminUserId && finalEmail === adminEmail) {
      console.log('✅ SUCCESS: Admin session preserved throughout user creation!')
      console.log('✅ Session preservation fix is working correctly')
    } else {
      console.error('❌ FAILURE: Admin session was switched!')
      console.error('Expected:', adminEmail, adminUserId)
      console.error('Got:', finalEmail, finalUserId)
    }

    // Step 4: Test admin can still perform admin operations
    console.log('🔍 Testing admin operations still work...')
    const { data: allUsers, error: readError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)

    if (readError) {
      console.error('❌ Admin lost read permissions:', readError.message)
    } else {
      console.log('✅ Admin can still read users:', allUsers.length, 'users found')
    }

  } catch (error) {
    console.error('💥 Exception during test:', error)

    // Check session after exception
    const { data: { session: errorSession } } = await supabase.auth.getSession()
    if (errorSession && errorSession.user.id === adminUserId) {
      console.log('✅ Admin session preserved even after exception')
    } else {
      console.error('❌ Admin session lost after exception')
    }
  }

  console.log('🧪 Test complete')
}

// Auto-run if createUser function is available
if (typeof createUser !== 'undefined') {
  testUserCreationFlow().catch(console.error)
} else {
  console.log('🚨 createUser function not found - make sure to load it first')
  console.log('You can copy the function from src/lib/users.ts or open the app')
}