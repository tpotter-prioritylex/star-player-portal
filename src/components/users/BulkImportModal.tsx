import { useState } from 'react'
import { X, Upload, Download, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { createUser, generateTemporaryPassword } from '../../lib/users'
import { sendWelcomeEmail } from '../../lib/emails'
import { WelcomeEmailCopy } from './WelcomeEmailCopy'
import type { UserRole } from '../../types'

interface BulkImportModalProps {
  onClose: () => void
  onUsersCreated: () => void
}

interface ImportRow {
  email: string
  full_name: string
  role: UserRole
  group_id: string
}

interface ImportResult {
  success: boolean
  email: string
  full_name: string
  password?: string
  error?: string
  emailStatus?: 'sending' | 'sent' | 'failed'
  emailError?: string
}

export function BulkImportModal({ onClose, onUsersCreated }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)

  const downloadTemplate = () => {
    const csv = `email,full_name,role,group_id
john.doe@example.com,John Doe,star_player,1
jane.smith@example.com,Jane Smith,instructor,
admin@example.com,Admin User,admin,`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      return {
        email: row.email,
        full_name: row.full_name,
        role: row.role as UserRole,
        group_id: row.group_id
      }
    }).filter(row => row.email && row.full_name)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResults(null)
    } else {
      alert('Please select a CSV file')
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      const importResults: ImportResult[] = []

      for (const row of rows) {
        if (!['admin', 'instructor', 'star_player'].includes(row.role)) {
          importResults.push({
            success: false,
            email: row.email,
            full_name: row.full_name,
            error: 'Invalid role'
          })
          continue
        }

        const password = generateTemporaryPassword()
        const groupId = row.group_id ? parseInt(row.group_id) : null

        const { data: _data, error } = await createUser({
          email: row.email,
          full_name: row.full_name,
          role: row.role,
          group_id: groupId,
          temporary_password: password
        })

        if (error) {
          importResults.push({
            success: false,
            email: row.email,
            full_name: row.full_name,
            error: error.message
          })
        } else {
          importResults.push({
            success: true,
            email: row.email,
            full_name: row.full_name,
            password,
            emailStatus: 'sending'
          })
        }
      }

      setResults(importResults)

      if (importResults.some(r => r.success)) {
        onUsersCreated()
      }

      // Send welcome emails to successfully created users
      const successfulUsers = importResults.filter(r => r.success)
      for (const user of successfulUsers) {
        if (user.password) {
          sendWelcomeEmail({
            email: user.email,
            full_name: user.full_name,
            temporary_password: user.password
          }).then((emailResult) => {
            setResults(prevResults =>
              prevResults ? prevResults.map(result =>
                result.email === user.email ? {
                  ...result,
                  emailStatus: emailResult.success ? 'sent' : 'failed',
                  emailError: emailResult.error
                } : result
              ) : null
            )
          })
        }
      }

    } catch (err: any) {
      alert(`Import failed: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  const downloadResults = () => {
    if (!results) return

    const csv = `email,full_name,password,status
${results.map(r => r.success
      ? `${r.email},${r.full_name},${r.password},Success`
      : `${r.email},${r.full_name},,Error: ${r.error}`
    ).join('\n')}`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-results.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const successfulUsers = results?.filter(r => r.success) || []
  const failedUsers = results?.filter(r => !r.success) || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-serif font-semibold text-navy">Bulk Import Users</h2>
          <button onClick={onClose} className="text-muted hover:text-dark">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!results ? (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                <Upload className="h-12 w-12 mx-auto text-muted mb-4" />
                <h3 className="text-lg font-medium text-dark mb-2">Upload CSV File</h3>
                <p className="text-muted mb-4">
                  Select a CSV file with user data to import multiple users at once.
                </p>

                <div className="space-y-4">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center mx-auto px-4 py-2 text-sm text-teal border border-teal rounded-md hover:bg-teal hover:text-white transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </button>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-navy file:text-white hover:file:bg-navy/90"
                  />
                </div>
              </div>

              {file && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-dark mb-2">Selected File</h4>
                  <p className="text-sm text-muted">{file.name}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Headers: email, full_name, role, group_id</li>
                  <li>• Roles: admin, instructor, star_player</li>
                  <li>• Group ID: 1-6 for star_player, empty for others</li>
                  <li>• All users get temporary passwords</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-dark">Import Results</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={downloadResults}
                    className="flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Results
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                {successfulUsers.length > 0 && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-900">
                        {successfulUsers.length} users created successfully
                      </h4>
                    </div>
                  </div>
                )}

                {failedUsers.length > 0 && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="font-medium text-red-900">
                        {failedUsers.length} users failed to create
                      </h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Successful Users with Copy Buttons */}
              {successfulUsers.length > 0 && (
                <div>
                  <h4 className="font-medium text-dark mb-3">Successfully Created Users</h4>
                  <div className="space-y-3">
                    {successfulUsers.map((user, idx) => (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-green-900">{user.full_name}</h5>
                            <p className="text-sm text-green-700">{user.email}</p>
                            <p className="text-xs text-green-600 font-mono mb-2">Password: {user.password}</p>

                            {/* Email Status */}
                            {user.emailStatus === 'sending' && (
                              <div className="flex items-center text-xs text-blue-600">
                                <Mail className="h-3 w-3 mr-1 animate-pulse" />
                                Sending credentials...
                              </div>
                            )}
                            {user.emailStatus === 'sent' && (
                              <div className="flex items-center text-xs text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Credentials sent
                              </div>
                            )}
                            {user.emailStatus === 'failed' && (
                              <div className="text-xs text-red-600">
                                <div className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Failed to send email
                                </div>
                                {user.emailError && (
                                  <p className="text-xs text-red-500 mt-1">{user.emailError}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <WelcomeEmailCopy
                              user={{
                                email: user.email,
                                full_name: user.full_name,
                                password: user.password!
                              }}
                              className="text-xs px-2 py-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Users */}
              {failedUsers.length > 0 && (
                <div>
                  <h4 className="font-medium text-dark mb-3">Failed to Create</h4>
                  <div className="space-y-2">
                    {failedUsers.map((user, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-red-900">{user.full_name}</h5>
                            <p className="text-sm text-red-700">{user.email}</p>
                          </div>
                          <p className="text-xs text-red-600">{user.error}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted hover:text-dark transition-colors"
          >
            {results ? 'Close' : 'Cancel'}
          </button>
          {!results && file && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing...' : 'Import Users'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}