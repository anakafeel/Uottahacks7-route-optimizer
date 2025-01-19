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

    // Log the configuration (without sensitive data)
    console.log('Solace configuration check:', {
      hostUrl: SOLACE_HOST_URL,
      vpnName: SOLACE_VPN_NAME,
      hasUsername: !!SOLACE_USERNAME,
      hasPassword: !!SOLACE_PASSWORD,
      expectedHost: 'mr-connection-tpv92rlf0qh.messaging.solace.cloud',
      expectedVpn: 'shiphappens'
    })

    if (!SOLACE_HOST_URL || !SOLACE_VPN_NAME || !SOLACE_USERNAME || !SOLACE_PASSWORD) {
      console.error('Missing Solace configuration:', {
        hasHostUrl: !!SOLACE_HOST_URL,
        hasVpnName: !!SOLACE_VPN_NAME,
        hasUsername: !!SOLACE_USERNAME,
        hasPassword: !!SOLACE_PASSWORD
      })
      throw new Error('Missing required Solace configuration')
    }

    // Validate host URL and VPN name match expected values
    if (SOLACE_HOST_URL !== 'mr-connection-tpv92rlf0qh.messaging.solace.cloud') {
      console.warn('Host URL mismatch:', {
        current: SOLACE_HOST_URL,
        expected: 'mr-connection-tpv92rlf0qh.messaging.solace.cloud'
      })
    }

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