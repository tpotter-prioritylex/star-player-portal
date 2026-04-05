// supabase/functions/send-announcement-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnnouncementEmailRequest {
  title: string
  content: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { title, content }: AnnouncementEmailRequest = await req.json()

    // Validate required fields
    if (!title || !content) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: title, content'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query all active star_player and instructor users
    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('email, full_name, role')
      .in('role', ['star_player', 'instructor'])

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch users',
          details: dbError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users found to send announcement to',
          sent_count: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare email content
    const subject = `PriorityLex Training -- New Announcement: ${title}`
    const contentPreview = content.length > 200 ? content.substring(0, 200) + '...' : content

    // Prepare email list for Resend (batch send)
    const emailList = users.map(user => user.email)

    const textContent = `${contentPreview}

Log in to the Star Player Training Portal to read the full announcement:
https://portal.prioritylex.com

-- PriorityLex, LLC`

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .announcement-box { background: #f8fafc; padding: 20px; border-left: 4px solid #0d9488; margin: 20px 0; }
        .button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PriorityLex Training</h1>
        <p>New Announcement</p>
    </div>
    <div class="content">
        <h2>${title}</h2>

        <div class="announcement-box">
            <p>${contentPreview}</p>
        </div>

        <a href="https://portal.prioritylex.com" class="button">View Full Announcement</a>

        <p>Log in to the Star Player Training Portal to read the full announcement and access additional resources.</p>

        <p>-- PriorityLex, LLC</p>
    </div>
    <div class="footer">
        <p>PriorityLex Star Player Training Portal</p>
        <p>Questions? Contact us at training@prioritylex.com</p>
    </div>
</body>
</html>`

    // Send emails via Resend API (batch send to all users)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Star Player Training <training@prioritylex.com>',
        to: emailList,
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', responseData)
      return new Response(
        JSON.stringify({
          error: 'Failed to send announcement emails',
          details: responseData
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Announcement emails sent successfully to:', users.length, 'users')
    return new Response(
      JSON.stringify({
        success: true,
        email_id: responseData.id,
        sent_count: users.length,
        recipients: emailList,
        message: `Announcement email sent to ${users.length} users`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-announcement-email function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})