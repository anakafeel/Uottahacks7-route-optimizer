import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Get environment variables
    const config = {
      SOLACE_HOST_URL: Deno.env.get('SOLACE_HOST_URL'),
      SOLACE_VPN_NAME: Deno.env.get('SOLACE_VPN_NAME'),
      SOLACE_USERNAME: Deno.env.get('SOLACE_USERNAME'),
      SOLACE_PASSWORD: Deno.env.get('SOLACE_PASSWORD')
    }

    // Validate all required environment variables
    const missingVars = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      console.error('Missing required Solace environment variables:', missingVars)
      throw new Error(`Missing required Solace credentials: ${missingVars.join(', ')}`)
    }

    console.log('Returning Solace configuration')

    return new Response(
      JSON.stringify(config),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in get-solace-config function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check Edge Function logs for more information'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500 
      }
    )
  }
})