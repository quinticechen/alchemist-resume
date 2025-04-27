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
      console.error('Missing Notion API key or database ID')
      return new Response(
        JSON.stringify({ 
          error: 'Notion API key or database ID not configured', 
          details: {
            hasApiKey: !!notionApiKey,
            hasDatabaseId: !!databaseId
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Fetching data from Notion database:', databaseId)

    // Query the Notion database with detailed pagination handling
    let allPages: NotionPage[] = [];
    let hasMore = true;
    let nextCursor = undefined;
    
    while (hasMore) {
      const queryBody: any = {
        page_size: 100 // Maximum allowed by Notion API
      };
      
      if (nextCursor) {
        queryBody.start_cursor = nextCursor;
      }
      
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryBody)
      });

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Notion API error:', errorText)
        return new Response(
          JSON.stringify({ 
            error: `Notion API error: ${response.status}`, 
            details: errorText 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        )
      }

      const data = await response.json();
      allPages = allPages.concat(data.results as NotionPage[]);
      
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    const pages = allPages;
    
    console.log(`Found ${pages.length} pages in Notion database`)

    // First, let's clear all the existing platforms to avoid duplicates
    // This is optional and can be removed if you want to keep old records
    const { error: deleteError } = await supabase
      .from('Platform')
      .delete()
      .not('id', 'is', null); // Safety check to avoid deleting everything if there's an issue
      
    if (deleteError) {
      console.error('Error clearing Platform table:', deleteError);
      // Continue with the process even if clearing fails
    } else {
      console.log('Successfully cleared Platform table');
    }
    
    // Process each page from Notion and sync to Supabase
    const syncResults = await Promise.all(pages.map(async (page, index) => {
      try {
        console.log(`Processing page ${index + 1}/${pages.length}: ${page.id}`);
        
        // More robust title extraction
        const title = 
          page.properties.Name?.title?.[0]?.plain_text || 
          page.properties.Platform?.title?.[0]?.plain_text || 
          page.properties.Title?.title?.[0]?.plain_text ||
          page.properties.URL?.title?.[0]?.plain_text ||
          'Untitled';
        
        // More comprehensive URL extraction
        const url = 
          page.properties.URL?.url || 
          page.properties.Link?.url || 
          page.properties.Website?.url || 
          page.url || 
          '';
        
        // More robust description extraction
        const description = 
          page.properties.Description?.rich_text?.[0]?.plain_text || 
          page.properties.Notes?.rich_text?.[0]?.plain_text || 
          '';

        // Log the extracted data for debugging
        console.log(`Extracted data for ${title}:`, { url, description: description.substring(0, 50) + (description.length > 50 ? '...' : '') });

        // Prepare data for Supabase with comprehensive attribute mapping
        const platformData = {
          id: page.id,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          url: url,
          attrs: {
            title: title,
            description: description,
            notionUrl: page.url,
            ...Object.fromEntries(
              Object.entries(page.properties)
                .filter(([key, value]) => value && value.type !== 'title' && key !== 'URL' && key !== 'Description')
                .map(([key, value]) => {
                  const propertyKey = key.toLowerCase().replace(/\s+/g, '_');
                  let propertyValue = '';
                  
                  // Extract value based on property type
                  if (value.rich_text && value.rich_text[0]) {
                    propertyValue = value.rich_text[0].plain_text;
                  } else if (value.url) {
                    propertyValue = value.url;
                  } else if (value.select && value.select.name) {
                    propertyValue = value.select.name;
                  } else if (value.multi_select && value.multi_select.length > 0) {
                    propertyValue = value.multi_select.map(item => item.name).join(', ');
                  } else if (value.checkbox !== undefined) {
                    propertyValue = value.checkbox ? 'Yes' : 'No';
                  } else if (value.date) {
                    propertyValue = value.date.start;
                  } else if (value.number !== undefined) {
                    propertyValue = String(value.number);
                  } else if (value.email) {
                    propertyValue = value.email;
                  } else if (value.phone_number) {
                    propertyValue = value.phone_number;
                  }
                  
                  return [propertyKey, propertyValue];
                })
            )
          }
        };

        // Upsert to Platform table in Supabase
        const { data: upsertedData, error } = await supabase
          .from('Platform')
          .upsert(platformData, { 
            onConflict: 'id', 
            returning: 'minimal' 
          });

        if (error) {
          console.error(`Error syncing page ${title} to Supabase:`, error);
          return { 
            id: page.id, 
            title, 
            status: 'error', 
            error: error.message 
          };
        }
        
        return { 
          id: page.id, 
          title, 
          status: 'success' 
        };
      } catch (err) {
        console.error('Error processing Notion page:', err);
        return { 
          id: page.id || 'unknown', 
          status: 'error', 
          error: err.message 
        };
      }
    }));
    
    const successCount = syncResults.filter(r => r.status === 'success').length;
    const errorCount = syncResults.filter(r => r.status === 'error').length;
    
    // Return the sync results with more detailed information
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${successCount} pages successfully. Failed: ${errorCount}`, 
        results: syncResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in Notion sync:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
