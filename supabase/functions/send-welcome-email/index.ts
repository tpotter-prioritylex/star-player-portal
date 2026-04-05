// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  email: string
  full_name: string
  temporary_password: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { email, full_name, temporary_password }: WelcomeEmailRequest = await req.json()

    // Validate required fields
    if (!email || !full_name || !temporary_password) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email, full_name, temporary_password'
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

    // Prepare email content
    const subject = 'PriorityLex Star Player Training Portal -- Your Login Credentials'
    const textContent = `Welcome to the PriorityLex Star Player Training Academy, ${full_name}.

Use the credentials below to access the training portal.

Portal URL: https://portal.prioritylex.com
Email: ${email}
Temporary Password: ${temporary_password}

Please change your password after your first login by clicking your name in the bottom left corner and selecting "Change Password."

-- PriorityLex, LLC`

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PriorityLex Training Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .credentials-box { background: #fef3c7; padding: 20px; border: 1px solid #f59e0b; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to PriorityLex</h1>
        <p>Star Player Training Academy</p>
    </div>
    <div class="content">
        <p>Welcome to the PriorityLex Star Player Training Academy, <strong>${full_name}</strong>.</p>

        <p>Use the credentials below to access the training portal.</p>

        <div class="credentials-box">
            <p><strong>Portal URL:</strong> https://portal.prioritylex.com</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${temporary_password}</code></p>
        </div>

        <a href="https://portal.prioritylex.com" class="button">Access Training Portal</a>

        <p><strong>Important:</strong> Please change your password after your first login by clicking your name in the bottom left corner and selecting "Change Password."</p>

        <p>-- PriorityLex, LLC</p>
    </div>
    <div class="footer">
        <p>PriorityLex Star Player Training Portal</p>
        <p>Questions? Contact us at training@prioritylex.com</p>
    </div>
</body>
</html>`

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Star Player Training <training@prioritylex.com>',
        to: [email],
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
          error: 'Failed to send email',
          details: responseData
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Welcome email sent successfully to:', email)
    return new Response(
      JSON.stringify({
        success: true,
        email_id: responseData.id,
        message: `Welcome email sent to ${email}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
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