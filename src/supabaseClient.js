import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kkjffxngnezmemlduffw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_mSyknECUOHVM396fWdOAgA_r3T4UJJv'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
