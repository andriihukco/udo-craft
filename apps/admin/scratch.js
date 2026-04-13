import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hsyxyzmnhjybklvlaelw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeXh5em1uaGp5YmtsdmxhZWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAwMzYzNCwiZXhwIjoyMDg5NTc5NjM0fQ.xFzVjKqmIUHvZWGLHga7aR4FLPNLKYwCKvSuVum-g3Y'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1)
  console.log(error || data)
  
  // try inserting description
  const { error: err } = await supabase.from('products').update({ description: 'test' }).eq('id', '00000000-0000-0000-0000-000000000000')
  console.log('Update Error:', err)
}
test()
