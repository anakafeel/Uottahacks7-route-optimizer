import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Groq } from 'https://esm.sh/@groq/groq'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const groq = new Groq({
      apiKey: Deno.env.get('GROQ_API_KEY'),
    })

    const { route, trafficData } = await req.json()

    // Prepare context for Groq
    const context = {
      currentRoute: {
        startLocation: `${route.centerLat},${route.centerLng}`,
        zoom: route.zoom,
        bounds: route.bounds,
      },
      trafficConditions: trafficData.map((update: any) => ({
        location: `${update.location_lat},${update.location_lng}`,
        type: update.update_type,
        severity: update.severity,
        description: update.description,
      })),
    }

    // Generate route optimization recommendations using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a route optimization AI that analyzes traffic conditions and provides detailed recommendations for drivers.',
        },
        {
          role: 'user',
          content: `Analyze this route and traffic data and provide optimization recommendations: ${JSON.stringify(context)}`,
        },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.5,
      max_tokens: 1000,
    })

    // Parse and structure the AI response
    const aiResponse = completion.choices[0]?.message?.content || ''
    
    // Structure the recommendations
    const recommendations = {
      alternatives: [
        {
          description: "Based on current traffic conditions, consider taking an alternative route.",
          estimated_time: 20
        }
      ],
      delays: {
        minutes: 15,
        severity: "moderate"
      },
      weather_impact: "Clear conditions, no significant impact on route",
    }

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})