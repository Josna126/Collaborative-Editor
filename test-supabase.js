const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bboyzvyhvwtatqnnyted.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib3l6dnlodnd0YXRxbm55dGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzcwNDUsImV4cCI6MjA4Nzg1MzA0NX0.USUiyxBk5YNrAVNWFeWGpsSsnefW4kniOKXJv-b5EXE';

console.log('Testing Supabase connection...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test connection by querying documents table
    const { data, error } = await supabase
      .from('documents')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error connecting to Supabase:', error.message);
      console.log('\nPlease ensure:');
      console.log('1. The documents table exists in your Supabase database');
      console.log('2. Run the SQL from supabase-schema.sql in your Supabase SQL editor');
      console.log('3. Your .env.local file has correct credentials');
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Documents table is accessible');
    }
  } catch (err) {
    console.error('❌ Failed to connect:', err.message);
  }
}

testConnection();
