import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SOLACE_HOST_URL = Deno.env.get('SOLACE_HOST_URL')
    const SOLACE_VPN_NAME = Deno.env.get('SOLACE_VPN_NAME')
    const SOLACE_USERNAME = Deno.env.get('SOLACE_USERNAME')
    const SOLACE_PASSWORD = Deno.env.get('SOLACE_PASSWORD')

    if (!SOLACE_HOST_URL || !SOLACE_VPN_NAME || !SOLACE_USERNAME || !SOLACE_PASSWORD) {
      throw new Error('Missing required Solace configuration')
    }

    return new Response(
      JSON.stringify({
        SOLACE_HOST_URL,
        SOLACE_VPN_NAME,
        SOLACE_USERNAME,
        SOLACE_PASSWORD,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in get-solace-config function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    )
  }
})