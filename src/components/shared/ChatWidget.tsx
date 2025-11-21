// src/components/shared/ChatWidget.tsx
'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Loader2,
  CheckCheck,
  Clock,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  is_read: boolean
  created_at: string
}

type Contact = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  unread_count?: number
}

export default function ChatWidget() {
  const supabase = createSupabaseBrowserClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    loadUserAndContacts()
  }, [])

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id)
      markMessagesAsRead(selectedContact.id)
    }
  }, [selectedContact])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          if (selectedContact && newMsg.sender_id === selectedContact.id) {
            setMessages(prev => [...prev, newMsg])
            markMessagesAsRead(selectedContact.id)
          }
          loadUserAndContacts() // Refresh contacts to update unread count
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, selectedContact])

  // Update total unread count
  useEffect(() => {
    const total = contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0)
    setTotalUnread(total)
  }, [contacts])

  async function loadUserAndContacts() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      setCurrentUser(user)

      let contactsList: Contact[] = []

      // Students can message teachers
      const { data: teachers } = await supabase
        .from('teachers')
        .select('user_id, first_name, last_name')

      if (teachers) {
        const teacherContacts = teachers
          .filter(t => t.user_id)
          .map(t => ({
            id: t.user_id,
            email: '',
            first_name: t.first_name,
            last_name: t.last_name,
            role: 'teacher'
          }))
        contactsList.push(...teacherContacts)
      }

      // Students can also message superadmins
      try {
        const response = await fetch('/api/get-superadmins')
        if (response.ok) {
          const { superadmins } = await response.json()
          const superadminContacts = superadmins
            .filter((u: any) => u.id !== user.id)
            .map((u: any) => ({
              id: u.id,
              email: u.email,
              first_name: u.first_name,
              last_name: u.last_name,
              role: 'superadmin'
            }))
          contactsList.push(...superadminContacts)
        }
      } catch (error) {
        console.error('Error loading superadmins:', error)
      }

      // Get unread message counts
      for (const contact of contactsList) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', contact.id)
          .eq('receiver_id', user.id)
          .eq('is_read', false)

        contact.unread_count = count || 0
      }

      setContacts(contactsList)
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  async function loadMessages(contactId: string) {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      
      // Auto scroll to bottom
      setTimeout(() => {
        const messagesContainer = document.getElementById('chat-messages-container')
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  async function markMessagesAsRead(contactId: string) {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', contactId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false)
      
      // Update unread count in contacts list
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, unread_count: 0 } : c
      ))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedContact || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedContact.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      loadMessages(selectedContact.id)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase()
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
    return fullName.includes(query)
  })

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        aria-label="เปิดแชท"
      >
        <MessageSquare className="w-7 h-7" />
        {totalUnread > 0 && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <div>
                <h3 className="font-bold">ข้อความ</h3>
                {selectedContact && (
                  <p className="text-xs text-rose-100">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setSelectedContact(null)
                }}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="h-[calc(100%-4rem)] flex">
              {/* Contacts List */}
              {!selectedContact ? (
                <div className="w-full flex flex-col">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="ค้นหาครู/Admin..."
                        aria-label="ค้นหา"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        ไม่พบครู/Admin
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-pink-50 transition-colors border-b"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{contact.role === 'superadmin' ? 'Admin' : 'ครู'}</p>
                          </div>
                          {contact.unread_count! > 0 && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {contact.unread_count}
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Chat View */
                <div className="w-full flex flex-col">
                  {/* Back Button */}
                  <div className="p-3 border-b">
                    <button
                      onClick={() => setSelectedContact(null)}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      ← กลับ
                    </button>
                  </div>
                  
                  {/* Messages */}
                  <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm">เริ่มสนทนาเลย!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSender = msg.sender_id === currentUser.id
                        return (
                          <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                              isSender 
                                ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-900 shadow-sm'
                            }`}>
                              <p className="text-xs break-words">{msg.message}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-2.5 h-2.5 opacity-70" />
                                <p className="text-[10px] opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {isSender && msg.is_read && (
                                  <CheckCheck className="w-2.5 h-2.5 opacity-70 ml-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="พิมพ์ข้อความ..."
                        aria-label="เขียนข้อความ"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="flex-1 text-sm"
                        disabled={sending}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                        className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

