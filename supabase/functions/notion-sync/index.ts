
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12'
import { Client } from 'https://esm.sh/@notionhq/client@2.2.13';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = 'https://vhofgqmmovjtcnakowlv.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Handle CORS and check secrets
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const notionApiKey = Deno.env.get('NOTION_API_KEY')
    const databaseId = Deno.env.get('NOTION_DATABASE_ID')

    if (!notionApiKey || !databaseId) {
      console.error('Missing Notion credentials')
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          hasNotionApiKey: !!notionApiKey,
          hasNotionDatabaseId: !!databaseId,
          message: 'Missing required Notion credentials'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize clients with proper error handling
    const notion = new Client({ auth: notionApiKey })
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle status check request
    const { action } = await req.json().catch(() => ({ action: null }))
    if (action === 'check-status') {
      console.log('Status check request received')
      return new Response(
        JSON.stringify({
          hasNotionApiKey: true,
          hasNotionDatabaseId: true,
          message: "Configuration complete"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching pages from Notion database...')
    
    try {
      // Fetch database pages with proper error handling
      const pages = []
      let hasMore = true
      let startCursor = undefined
      
      while (hasMore) {
        const response = await notion.databases.query({
          database_id: databaseId,
          start_cursor: startCursor,
          page_size: 100
        })
        
        if (!response || !response.results) {
          throw new Error('Invalid response from Notion API')
        }
        
        pages.push(...response.results)
        hasMore = response.has_more || false
        startCursor = response.next_cursor || undefined
      }
      
      console.log(`Found ${pages.length} pages in database`)
      
      // Clear existing data
      const { error: deleteError } = await supabase
        .from('platform')
        .delete()
        .not('id', 'is', null)
      
      if (deleteError) {
        throw new Error(`Error clearing platform table: ${deleteError.message}`)
      }
      
      // Also clear platform_content
      const { error: deleteContentError } = await supabase
        .from('platform_content')
        .delete()
        .not('id', 'is', null)
      
      if (deleteContentError) {
        throw new Error(`Error clearing platform_content table: ${deleteContentError.message}`)
      }
      
      // Process pages and sync to Supabase
      const results = await Promise.all(pages.map(async (page: any) => {
        try {
          // Extract basic page info
          const pageId = page.id
          const notionUrl = page.url || ''
          const title = page.properties.Platform?.title?.[0]?.plain_text || 'Untitled'
          const url = page.properties.URL?.url || ''
          const description = page.properties.Description?.rich_text?.[0]?.plain_text || ''
          
          // Fetch page content and format as markdown
          let content = ''
          try {
            const blocks = await notion.blocks.children.list({ block_id: pageId })
            content = blocks.results
              .map((block: any) => {
                if (block.type === 'paragraph') {
                  return block.paragraph.rich_text.map((t: any) => t.plain_text).join('')
                } else if (block.type === 'heading_1') {
                  return `# ${block.heading_1.rich_text.map((t: any) => t.plain_text).join('')}`
                } else if (block.type === 'heading_2') {
                  return `## ${block.heading_2.rich_text.map((t: any) => t.plain_text).join('')}`
                } else if (block.type === 'heading_3') {
                  return `### ${block.heading_3.rich_text.map((t: any) => t.plain_text).join('')}`
                } else if (block.type === 'bulleted_list_item') {
                  return `• ${block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('')}`
                }
                return ''
              })
              .filter(text => text)
              .join('\n\n')
          } catch (error) {
            console.error(`Error fetching content for page ${pageId}: ${error.message}`)
          }
          
          // Insert platform record
          const { data: platformData, error: platformError } = await supabase
            .from('platform')
            .insert({
              id: pageId,
              url: url,
              created_time: page.created_time,
              last_edited_time: page.last_edited_time,
              attrs: { title, description, notionUrl }
            })
            .select()
            .single()
          
          if (platformError) throw platformError
          
          // Insert platform_content record
          const { error: contentError } = await supabase
            .from('platform_content')
            .insert({
              platform_id: pageId,
              title,
              description,
              content,
              notion_url: notionUrl,
              url
            })
          
          if (contentError) throw contentError
          
          return { id: pageId, title, status: 'success' }
        } catch (error) {
          console.error(`Error processing page: ${error.message}`)
          return { 
            id: page.id || 'unknown',
            title: page.properties?.Platform?.title?.[0]?.plain_text || 'Unknown',
            status: 'error',
            error: error.message
          }
        }
      }))
      
      const successCount = results.filter(r => r.status === 'success').length
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Synced ${successCount} pages successfully`,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error(`Error in Notion API operations: ${error.message}`)
      throw error
    }
  } catch (error) {
    console.error('Error in Notion sync:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
