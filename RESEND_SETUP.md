# Resend Email Setup Guide

This guide will walk you through setting up automated welcome and announcement emails using Resend.

## Prerequisites
- Supabase project with CLI access
- Domain access to prioritylex.com for DNS records
- Admin access to create DNS records

## Step 1: Create Resend Account

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account using your PriorityLex email
   - Verify your email address

2. **Get your API Key**
   - After logging in, go to the API Keys section
   - Click "Create API Key"
   - Name it "PriorityLex Portal"
   - Copy the API key (it starts with `re_`)
   - **Save this key securely - you'll need it later**

## Step 2: Verify Domain in Resend

1. **Add Domain**
   - In Resend dashboard, go to "Domains"
   - Click "Add Domain"
   - Enter: `prioritylex.com`
   - Click "Add"

2. **Get DNS Records**
   Resend will provide you with DNS records to add. You'll see something like:

   **SPF Record (TXT):**
   ```
   Name: prioritylex.com
   Type: TXT
   Value: v=spf1 include:resend.com ~all
   ```

   **DKIM Records (CNAME):**
   ```
   Name: resend._domainkey.prioritylex.com
   Type: CNAME
   Value: resend.wl.resend.com
   
   Name: resend2._domainkey.prioritylex.com
   Type: CNAME
   Value: resend2.wl.resend.com
   ```

   **DMARC Record (TXT):**
   ```
   Name: _dmarc.prioritylex.com
   Type: TXT
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@prioritylex.com
   ```

3. **Add DNS Records**
   - Contact your DNS provider (whoever manages prioritylex.com DNS)
   - Add all the DNS records provided by Resend
   - Wait 5-10 minutes for DNS propagation

4. **Verify Domain**
   - Back in Resend dashboard, click "Verify" on your domain
   - If verification fails, wait longer for DNS propagation and try again
   - Once verified, you'll see a green checkmark

## Step 3: Deploy Supabase Edge Functions

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to Your Project**
   ```bash
   cd C:\claude\star-player-portal
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   *Replace YOUR_PROJECT_REF with your actual Supabase project reference*

4. **Deploy the Edge Functions**
   ```bash
   supabase functions deploy send-welcome-email
   supabase functions deploy send-announcement-email
   ```

## Step 4: Add Resend API Key to Supabase

1. **Set Environment Variable**
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key_here
   ```
   
   *Replace `your_resend_api_key_here` with the actual API key from Step 1*

2. **Verify Secret**
   ```bash
   supabase secrets list
   ```
   
   You should see `RESEND_API_KEY` in the list.

## Step 5: Test the Email Flow

### Test Welcome Email

1. **Test via Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Edge Functions
   - Find `send-welcome-email` function
   - Click "Invoke function"
   - Use this test payload:
   ```json
   {
     "email": "your-test-email@example.com",
     "full_name": "Test User",
     "temporary_password": "TempPass123"
   }
   ```

2. **Test via App**
   - In your portal, create a new user
   - Check if you receive the welcome email
   - Verify the email contains correct credentials

### Test Announcement Email

1. **Test via Supabase Dashboard**
   - Go to Edge Functions
   - Find `send-announcement-email` function
   - Click "Invoke function"
   - Use this test payload:
   ```json
   {
     "title": "Test Announcement",
     "content": "This is a test announcement to verify the email system is working correctly."
   }
   ```

2. **Test via App**
   - In your portal, create a new announcement
   - All active instructors and star players should receive the email

## Step 6: Monitor Email Delivery

1. **Resend Dashboard**
   - Go to "Emails" section in Resend dashboard
   - Monitor delivery status, opens, clicks
   - Check for any bounces or complaints

2. **Supabase Edge Function Logs**
   - In Supabase dashboard, go to Edge Functions
   - Click on each function to view logs
   - Monitor for any errors or delivery issues

## DNS Records Summary

Add these DNS records to prioritylex.com:

| Type | Name | Value |
|------|------|-------|
| TXT | prioritylex.com | v=spf1 include:resend.com ~all |
| CNAME | resend._domainkey.prioritylex.com | resend.wl.resend.com |
| CNAME | resend2._domainkey.prioritylex.com | resend2.wl.resend.com |
| TXT | _dmarc.prioritylex.com | v=DMARC1; p=quarantine; rua=mailto:dmarc@prioritylex.com |

## Troubleshooting

### Domain Verification Issues
- **Problem**: Domain won't verify
- **Solution**: 
  - Wait 15-30 minutes for DNS propagation
  - Use `nslookup` or online DNS checker to verify records are live
  - Check that DNS records match exactly (no extra spaces)

### Email Delivery Issues
- **Problem**: Emails not being sent
- **Solution**:
  - Check Supabase Edge Function logs for errors
  - Verify RESEND_API_KEY is set correctly: `supabase secrets list`
  - Test API key in Resend dashboard

### Edge Function Errors
- **Problem**: Functions fail to deploy
- **Solution**:
  - Ensure you're linked to correct Supabase project
  - Check that functions are in correct directories
  - Verify TypeScript syntax in function files

## Security Notes

1. **API Key Security**
   - Never commit Resend API key to git
   - Only store in Supabase secrets
   - Regenerate key if ever compromised

2. **Email Rate Limits**
   - Resend free tier: 100 emails/day
   - Monitor usage in Resend dashboard
   - Upgrade plan if needed for production

3. **DNS Security**
   - DMARC policy set to "quarantine" for security
   - Monitor DMARC reports for spoofing attempts

## Success Checklist

- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] DNS records added and verified
- [ ] Edge Functions deployed successfully
- [ ] RESEND_API_KEY set in Supabase secrets
- [ ] Welcome email test successful
- [ ] Announcement email test successful
- [ ] Email delivery monitoring set up

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Check Resend dashboard for delivery status
3. Verify DNS records are correct
4. Contact Resend support for domain issues
5. Contact Supabase support for Edge Function issues