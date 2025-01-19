import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get Solace configuration from environment variables
    const SOLACE_HOST_URL = Deno.env.get('SOLACE_HOST_URL')
    const SOLACE_VPN_NAME = Deno.env.get('SOLACE_VPN_NAME')
    const SOLACE_USERNAME = Deno.env.get('SOLACE_USERNAME')

    // Return the configuration
    return new Response(
      JSON.stringify({
        SOLACE_HOST_URL,
        SOLACE_VPN_NAME,
        SOLACE_USERNAME,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})