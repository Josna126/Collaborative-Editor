const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bboyzvyhvwtatqnnyted.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib3l6dnlodnd0YXRxbm55dGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzcwNDUsImV4cCI6MjA4Nzg1MzA0NX0.USUiyxBk5YNrAVNWFeWGpsSsnefW4kniOKXJv-b5EXE';

console.log('Testing Supabase Auth connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    // Test 1: Check if we can reach Supabase
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Connection error:', error.message);
    } else {
      console.log('✅ Connection successful!');
    }

    // Test 2: Try to sign up a test user
    console.log('\n2. Testing signup...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'test123456';
    const testName = 'Test User';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
        },
      },
    });

    if (signupError) {
      console.error('❌ Signup error:', signupError.message);
      if (signupError.message.includes('Email rate limit exceeded')) {
        console.log('ℹ️  This is normal - Supabase limits signup attempts');
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);
      console.log('Email:', signupData.user?.email);
      console.log('Full Name:', signupData.user?.user_metadata?.full_name);
    }

    // Test 3: Check auth settings
    console.log('\n3. Checking Supabase project status...');
    console.log('If you see errors above, your Supabase project might be:');
    console.log('  - Paused (free tier projects pause after inactivity)');
    console.log('  - Not configured for email auth');
    console.log('  - Having network issues');
    console.log('\nTo fix:');
    console.log('  1. Go to https://supabase.com/dashboard');
    console.log('  2. Check if your project is paused and unpause it');
    console.log('  3. Go to Authentication > Providers');
    console.log('  4. Enable Email provider');
    console.log('  5. Disable email confirmation (for testing)');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testAuth();
