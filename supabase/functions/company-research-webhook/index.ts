import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestData = await req.json()
    console.log('Received company research data:', requestData)

    // Extract job ID from the request
    const jobId = requestData.jobId || requestData.job_id

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract company profile data
    const companyProfile = requestData.companyProfile || requestData

    // Prepare the data for database insertion
    const companyData = {
      job_id: jobId,
      status: 'completed',
      company_name: companyProfile.basicInformation?.companyName || '',
      company_website: companyProfile.basicInformation?.['Company Website'] || '',
      career_page: companyProfile.basicInformation?.['Career Page'] || '',
      founded: companyProfile.basicInformation?.founded || '',
      headquarters: companyProfile.basicInformation?.headquarters || '',
      industry: companyProfile.basicInformation?.industry || '',
      number_of_employees: companyProfile.basicInformation?.numberOfEmployees || '',
      revenue: companyProfile.basicInformation?.revenue || '',
      ceo: companyProfile.basicInformation?.CEO || '',
      business_overview: companyProfile.businessOverview || '',
      key_products_services: companyProfile.keyProductsAndServices || [],
      main_competitors: companyProfile.marketPosition?.mainCompetitors || '',
      market_share: companyProfile.marketPosition?.marketShare || '',
      competitive_advantages: companyProfile.marketPosition?.competitiveAdvantages || '',
      stock_performance: companyProfile.financialPerformance?.stockPerformance || '',
      pe_ratio: companyProfile.financialPerformance?.peRatio || '',
      growth_rate: companyProfile.financialPerformance?.growthRate || '',
      core_values: companyProfile.companyculture?.coreValues || '',
      work_environment: companyProfile.companyculture?.workEnvironment || '',
      employee_benefits: companyProfile.companyculture?.employeeBenefits || '',
      recent_news: companyProfile.recentNews || [],
      swot_strengths: companyProfile.swotAnalysis?.strengths || '',
      swot_weaknesses: companyProfile.swotAnalysis?.weaknesses || '',
      swot_opportunities: companyProfile.swotAnalysis?.opportunities || '',
      swot_threats: companyProfile.swotAnalysis?.threats || ''
    }

    // First, find the user_id for this job
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .select('user_id')
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('Error finding job:', jobError)
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add user_id to company data
    companyData.user_id = jobData.user_id

    // Update or insert the company data
    const { data, error } = await supabaseClient
      .from('companies')
      .upsert(companyData)
      .select()

    if (error) {
      console.error('Error updating company data:', error)
      console.error('Company data being inserted:', companyData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update company data', 
          details: error.message,
          hint: error.hint 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully updated company data:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Company research data received and stored',
        data: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing company research webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})