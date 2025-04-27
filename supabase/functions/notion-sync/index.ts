
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const supabaseUrl = 'https://vhofgqmmovjtcnakowlv.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Define interface for Notion page objects
interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
  url: string;
  created_time: string;
  last_edited_time: string;
}

// Handler for HTTP requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const notionApiKey = Deno.env.get('NOTION_API_KEY') || ''
    const databaseId = Deno.env.get('NOTION_DATABASE_ID') || ''

    if (!notionApiKey || !databaseId) {
      return new Response(
        JSON.stringify({ error: 'Notion API key or database ID not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Fetching data from Notion database:', databaseId)

    // Query the Notion database
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100 // Adjust based on your needs
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API error:', errorText)
      return new Response(
        JSON.stringify({ error: `Notion API error: ${response.status}`, details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    const pages = data.results as NotionPage[]
    
    console.log(`Found ${pages.length} pages in Notion database`)
    
    // Process each page from Notion and sync to Supabase
    const syncResults = await Promise.all(pages.map(async (page) => {
      try {
        // Extract platform name/title
        const title = page.properties.Platform?.title?.[0]?.plain_text || 
                      page.properties.Name?.title?.[0]?.plain_text || 
                      'Untitled'
        
        // Extract URL
        const url = page.properties.URL?.url || 
                   page.properties.url?.url || 
                   page.properties.URL?.rich_text?.[0]?.plain_text || 
                   ''
        
        // Extract description/notes
        const description = page.properties.Description?.rich_text?.[0]?.plain_text || 
                          ''

        // Prepare data for Supabase
        const platformData = {
          id: page.id,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          url: url,
          attrs: {
            title: title,
            description: description,
            notionUrl: page.url
          }
        }

        // Upsert to Platform table in Supabase
        const { data, error } = await supabase
          .from('Platform')
          .upsert(platformData, { onConflict: 'id' })

        if (error) {
          console.error('Error syncing page to Supabase:', error)
          return { 
            id: page.id, 
            title, 
            status: 'error', 
            error: error.message 
          }
        }
        
        return { 
          id: page.id, 
          title, 
          status: 'success' 
        }
      } catch (err) {
        console.error('Error processing Notion page:', err)
        return { 
          id: page.id, 
          status: 'error', 
          error: err.message 
        }
      }
    }))
    
    // Return the sync results
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${syncResults.filter(r => r.status === 'success').length} pages`, 
        results: syncResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in Notion sync:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
