
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12'
import { Client } from 'https://esm.sh/@notionhq/client@2.2.13';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = 'https://vhofgqmmovjtcnakowlv.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Handle CORS and check secrets
Deno.serve(async (req) => {
  // CORS preflight request handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Notion credentials from environment variables
    const notionApiKey = Deno.env.get('NOTION_API_KEY')
    const databaseId = Deno.env.get('NOTION_DATABASE_ID')

    // Check if credentials exist
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

    // Initialize clients
    const notion = new Client({ auth: notionApiKey })
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle status check request
    let reqData = null
    try {
      reqData = await req.json().catch(() => ({ action: null }))
    } catch (e) {
      console.log('Failed to parse request body, assuming default action')
      reqData = { action: null }
    }
    
    const action = reqData?.action
    
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
    
    // Fetch all pages from the Notion database
    let pages = []
    let hasMore = true
    let startCursor = undefined

    try {
      while (hasMore) {
        console.log(`Querying database ${databaseId} with cursor ${startCursor || 'initial'}`)
        // Use database.query to fetch pages from Notion
        const response = await notion.databases.query({
          database_id: databaseId,
          start_cursor: startCursor,
          page_size: 100
        })
        
        if (!response || !response.results) {
          throw new Error('Invalid response from Notion API')
        }
        
        pages = [...pages, ...response.results]
        hasMore = response.has_more || false
        startCursor = response.next_cursor || undefined
      }
      
      console.log(`Found ${pages.length} pages in database`)
      
      // Clear platform_content table
      const { error: deleteContentError } = await supabase
        .from('platform_content')
        .delete()
        .not('id', 'is', null)
      
      if (deleteContentError) {
        throw new Error(`Error clearing platform_content table: ${deleteContentError.message}`)
      }
      
      // Process each page and save to Supabase
      const results = await Promise.all(pages.map(async (page) => {
        try {
          // Extract basic page info
          const pageId = page.id
          const notionUrl = page.url || ''
          
          // Extract page properties with proper error handling
          let title = 'Untitled'
          let url = ''
          let description = ''
          
          try {
            if (page.properties?.Platform?.title && page.properties.Platform.title.length > 0) {
              title = page.properties.Platform.title[0].plain_text || 'Untitled'
            }
            
            if (page.properties?.URL) {
              url = page.properties.URL.url || ''
            }
            
            if (page.properties?.Description?.rich_text && 
                page.properties.Description.rich_text.length > 0) {
              description = page.properties.Description.rich_text[0].plain_text || ''
            }
          } catch (propError) {
            console.error(`Error extracting properties from page ${pageId}: ${propError.message}`)
          }
          
          // Fetch page content
          let content = ''
          try {
            const blocks = await notion.blocks.children.list({ block_id: pageId })
            content = blocks.results
              .map((block) => {
                // Get block type
                const blockType = block.type
                if (!blockType || !block[blockType]) return ''
                
                // Handle different block types
                if (blockType === 'paragraph') {
                  return block.paragraph.rich_text.map((t) => t.plain_text).join('')
                } else if (blockType === 'heading_1') {
                  return `# ${block.heading_1.rich_text.map((t) => t.plain_text).join('')}`
                } else if (blockType === 'heading_2') {
                  return `## ${block.heading_2.rich_text.map((t) => t.plain_text).join('')}`
                } else if (blockType === 'heading_3') {
                  return `### ${block.heading_3.rich_text.map((t) => t.plain_text).join('')}`
                } else if (blockType === 'bulleted_list_item') {
                  return `• ${block.bulleted_list_item.rich_text.map((t) => t.plain_text).join('')}`
                }
                return ''
              })
              .filter(text => text)
              .join('\n\n')
          } catch (error) {
            console.error(`Error fetching content for page ${pageId}: ${error.message}`)
          }
          
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
