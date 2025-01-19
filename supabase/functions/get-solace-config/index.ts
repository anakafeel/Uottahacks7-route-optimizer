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
    // These values are taken directly from the Solace console image
    const config = {
      SOLACE_HOST_URL: 'mr-connection-tpv92rfqh.messaging.solace.cloud',
      SOLACE_VPN_NAME: 'shiphappens',
      SOLACE_USERNAME: Deno.env.get('SOLACE_USERNAME'),
      SOLACE_PASSWORD: Deno.env.get('SOLACE_PASSWORD')
    }

    // Validate required environment variables
    if (!config.SOLACE_USERNAME || !config.SOLACE_PASSWORD) {
      console.error('Missing required Solace credentials');
      throw new Error('Missing required Solace credentials');
    }

    console.log('Returning Solace configuration:', {
      hostUrl: config.SOLACE_HOST_URL,
      vpnName: config.SOLACE_VPN_NAME,
      hasUsername: !!config.SOLACE_USERNAME,
      hasPassword: !!config.SOLACE_PASSWORD
    });

    return new Response(
      JSON.stringify(config),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in get-solace-config function:', error);
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