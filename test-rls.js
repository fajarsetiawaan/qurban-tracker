
import { createClient } from '@supabase/supabase-js'

// TODO: Isi URL dan KEY dari Project Settings > API
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testRLS() {
  console.log('🚀 Memulai pengujian RLS...')

  // Login
  // TODO: Isi email dan password user yang valid
  const email = 'user@example.com'
  const password = 'password123'

  console.log(`🔐 Mencoba login sebagai ${email}...`)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error('❌ Gagal login:', authError.message)
    return
  }

  console.log('✅ Login berhasil! User ID:', authData.user.id)
  const userId = authData.user.id

  // Uji coba 1: Insert data valid
  console.log('\n--- Uji Coba 1: Insert Data Valid ---')
  const validGroupData = {
    name: 'Grup Valid',
    user_id: userId, // Menggunakan ID user yang login
    // Tambahkan field lain jika diperlukan sesuai skema tabel groups
  }

  const { data: insertData, error: insertError } = await supabase
    .from('groups')
    .insert([validGroupData])
    .select()

  if (insertError) {
    console.error('❌ Gagal insert data valid:', insertError.message)
  } else {
    console.log('✅ Berhasil insert data valid:', insertData)
  }

  // Uji coba 2: Select data
  console.log('\n--- Uji Coba 2: Select Data ---')
  const { data: selectData, error: selectError } = await supabase
    .from('groups')
    .select('*')

  if (selectError) {
    console.error('❌ Gagal select data:', selectError.message)
  } else {
    console.log(`✅ Berhasil mengambil ${selectData.length} data grup`)
    // console.log(selectData) // Uncomment jika ingin melihat detail data
  }

  // Uji coba 3: Test Pelanggaran RLS
  console.log('\n--- Uji Coba 3: Test Pelanggaran RLS (Insert user_id palsu) ---')
  const fakeUserId = '00000000-0000-0000-0000-000000000000' // UUID palsu
  const invalidGroupData = {
    name: 'Grup Ilegal',
    user_id: fakeUserId,
  }

  const { data: invalidInsertData, error: invalidInsertError } = await supabase
    .from('groups')
    .insert([invalidGroupData])
    .select()

  if (invalidInsertError) {
    console.log('🛡️ RLS Berhasil! Aksi diblokir:', invalidInsertError.message)
    console.log('Detail Error:', invalidInsertError)
  } else {
    console.error('⚠️ BAHAYA: RLS Gagal insert user_id palsu berhasil masuk:', invalidInsertData)
  }
}

testRLS()
