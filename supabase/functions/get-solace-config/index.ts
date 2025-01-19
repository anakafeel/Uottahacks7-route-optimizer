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

    // Log the actual configuration values (without sensitive data)
    console.log('Current Solace configuration:', {
      hostUrl: SOLACE_HOST_URL,
      vpnName: SOLACE_VPN_NAME,
      hasUsername: !!SOLACE_USERNAME,
      hasPassword: !!SOLACE_PASSWORD
    })

    // Validate required environment variables
    if (!SOLACE_HOST_URL || !SOLACE_VPN_NAME || !SOLACE_USERNAME || !SOLACE_PASSWORD) {
      const missingVars = {
        SOLACE_HOST_URL: !SOLACE_HOST_URL,
        SOLACE_VPN_NAME: !SOLACE_VPN_NAME,
        SOLACE_USERNAME: !SOLACE_USERNAME,
        SOLACE_PASSWORD: !SOLACE_PASSWORD
      }
      console.error('Missing required Solace configuration:', missingVars)
      throw new Error(`Missing required Solace configuration: ${Object.keys(missingVars).filter(key => missingVars[key]).join(', ')}`)
    }

    // Validate host URL matches expected value
    const expectedHost = 'mr-connection-tpv92rfqh.messaging.solace.cloud'
    if (SOLACE_HOST_URL !== expectedHost) {
      console.warn('Host URL mismatch:', {
        current: SOLACE_HOST_URL,
        expected: expectedHost
      })
    }

    // Validate VPN name
    if (SOLACE_VPN_NAME !== 'shiphappens') {
      console.warn('VPN name mismatch:', {
        current: SOLACE_VPN_NAME,
        expected: 'shiphappens'
      })
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
      JSON.stringify({ 
        error: error.message,
        details: 'Check Edge Function logs for more information'
      }),
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