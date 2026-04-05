import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface User {
  email: string
  full_name: string
  password: string
}

interface WelcomeEmailCopyProps {
  user: User
  className?: string
}

export function WelcomeEmailCopy({ user, className = '' }: WelcomeEmailCopyProps) {
  const [copied, setCopied] = useState(false)

  const generateWelcomeEmail = (user: User) => {
    return `Subject: PriorityLex Star Player Training Portal -- Your Login Credentials

Welcome to the PriorityLex Star Player Training Academy. Use the credentials below to access the training portal.

Portal URL: https://portal.prioritylex.com
Email: ${user.email}
Temporary Password: ${user.password}

Please change your password after your first login by clicking your name in the bottom left corner and selecting "Change Password."

-- PriorityLex, LLC`
  }

  const copyToClipboard = async () => {
    try {
      const emailContent = generateWelcomeEmail(user)
      await navigator.clipboard.writeText(emailContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy welcome email:', err)
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = generateWelcomeEmail(user)
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`flex items-center px-3 py-2 text-sm bg-teal text-white rounded-md hover:bg-teal/80 transition-colors ${className}`}
      title="Copy welcome email to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy Welcome Email
        </>
      )}
    </button>
  )
}