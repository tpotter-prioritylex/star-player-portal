import { Hash, Megaphone, Users, MessageCircle } from 'lucide-react'
import type { ChatChannel } from '../../types'

interface ChatSidebarProps {
  channels: ChatChannel[]
  activeChannel: ChatChannel | null
  onSelectChannel: (channel: ChatChannel) => void
}

export function ChatSidebar({ channels, activeChannel, onSelectChannel }: ChatSidebarProps) {
  const getChannelIcon = (channel: ChatChannel) => {
    switch (channel.type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4" />
      case 'cohort':
        return <Users className="h-4 w-4" />
      case 'group':
        return <Hash className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: ChatChannel) => {
    switch (channel.type) {
      case 'announcement':
        return 'text-gold'
      case 'cohort':
        return 'text-teal'
      case 'group':
        return 'text-navy'
      default:
        return 'text-muted'
    }
  }

  // Group channels by type (no announcement channels - those are in separate Announcements page)
  const cohortChannels = channels.filter(c => c.type === 'cohort')
  const groupChannels = channels.filter(c => c.type === 'group').sort((a, b) => (a.group_id || 0) - (b.group_id || 0))

  return (
    <div className="w-64 bg-gray-50 border border-gray-200 rounded-l-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-serif font-medium text-navy">Chat Channels</h2>
      </div>

      <div className="p-4 space-y-6">

        {/* Cohort */}
        {cohortChannels.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Cohort
            </h3>
            <ul className="space-y-1">
              {cohortChannels.map((channel) => (
                <li key={channel.id}>
                  <button
                    onClick={() => onSelectChannel(channel)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      activeChannel?.id === channel.id
                        ? 'bg-navy text-white'
                        : 'text-dark hover:bg-gray-100'
                    }`}
                  >
                    <span className={`mr-2 ${activeChannel?.id === channel.id ? 'text-white' : getChannelColor(channel)}`}>
                      {getChannelIcon(channel)}
                    </span>
                    {channel.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Groups */}
        {groupChannels.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Training Groups
            </h3>
            <ul className="space-y-1">
              {groupChannels.map((channel) => (
                <li key={channel.id}>
                  <button
                    onClick={() => onSelectChannel(channel)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      activeChannel?.id === channel.id
                        ? 'bg-navy text-white'
                        : 'text-dark hover:bg-gray-100'
                    }`}
                  >
                    <span className={`mr-2 ${activeChannel?.id === channel.id ? 'text-white' : getChannelColor(channel)}`}>
                      {getChannelIcon(channel)}
                    </span>
                    {channel.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {channels.length === 0 && (
          <div className="text-center text-muted py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Loading chat channels...</div>
            <div className="text-xs mt-1">If this persists, check your permissions or refresh the page</div>
          </div>
        )}
      </div>
    </div>
  )
}