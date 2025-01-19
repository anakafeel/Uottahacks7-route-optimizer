import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Solace configuration from environment variables
    const SOLACE_HOST_URL = Deno.env.get('SOLACE_HOST_URL')
    const SOLACE_VPN_NAME = Deno.env.get('SOLACE_VPN_NAME')
    const SOLACE_USERNAME = Deno.env.get('SOLACE_USERNAME')

    // Return the configuration with CORS headers
    return new Response(
      JSON.stringify({
        SOLACE_HOST_URL,
        SOLACE_VPN_NAME,
        SOLACE_USERNAME,
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