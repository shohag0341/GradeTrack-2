// ============================================
// GRADETRACK - Telegram Auth Edge Function
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac, createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    
    // Verify Telegram init data
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // Parse init data
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Sort and create data check string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key and verify
    const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user data
    const userData = JSON.parse(urlParams.get('user'));
    const telegramId = userData.id;

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Set telegram ID for RLS
    await supabaseAdmin.rpc('set_telegram_id', { telegram_id: telegramId });

    // Create or get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        telegram_id: telegramId,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username || '',
        photo_url: userData.photo_url || ''
      }, { onConflict: 'telegram_id' })
      .select()
      .single();

    if (userError) throw userError;

    // Generate Supabase JWT
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${telegramId}@gradetrack.app`
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: user,
        telegram_id: telegramId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
