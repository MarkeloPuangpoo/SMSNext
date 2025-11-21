// src/app/student/messages/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Send, 
  Search, 
  User,
  Loader2,
  CheckCheck,
  Clock
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

export default function StudentMessagesPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  async function loadUserAndContacts() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

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

      // Students can message superadmins
      try {
        const response = await fetch('/api/get-superadmins')
        if (response.ok) {
          const { superadmins } = await response.json()
          const superadminContacts = superadmins.map((u: any) => ({
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
      setLoading(false)
    } catch (error) {
      console.error('Error loading contacts:', error)
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            ข้อความ
          </h1>
          <p className="text-gray-600 mt-2 ml-1">
            ส่งข้อความและติดต่อสื่อสารกับครู
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white p-6 border-b-4 border-rose-200">
              <CardTitle className="text-xl font-bold">รายชื่อครู/Admin</CardTitle>
              <CardDescription className="text-rose-50 text-sm mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
                  <Input
                    placeholder="ค้นหาครู/Admin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    ไม่พบครู
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-pink-50 transition-colors border-b ${
                        selectedContact?.id === contact.id ? 'bg-pink-100' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                        {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{contact.role === 'superadmin' ? 'Admin' : 'ครู'}</p>
                      </div>
                      {contact.unread_count! > 0 && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {contact.unread_count}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden lg:col-span-2">
            {selectedContact ? (
              <>
                <CardHeader className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white p-6 border-b-4 border-rose-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      {selectedContact.first_name.charAt(0)}{selectedContact.last_name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {selectedContact.role === 'superadmin' ? 'Admin' : 'ครู'} {selectedContact.first_name} {selectedContact.last_name}
                      </CardTitle>
                      <CardDescription className="text-rose-50 text-sm capitalize">
                        {selectedContact.role === 'superadmin' ? 'Admin' : 'ครูประจำวิชา'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Messages List */}
                  <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>ยังไม่มีข้อความ เริ่มสนทนาเลย!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSender = msg.sender_id === currentUser.id
                        return (
                          <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              isSender 
                                ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md' 
                                : 'bg-gray-100 text-gray-900 shadow-sm'
                            }`}>
                              <p className="text-sm break-words">{msg.message}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 opacity-70" />
                                <p className="text-xs opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {isSender && msg.is_read && (
                                  <CheckCheck className="w-3 h-3 opacity-70 ml-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="พิมพ์ข้อความ..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 border-gray-300"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-full py-32">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">เลือกครู/Admin เพื่อเริ่มสนทนา</p>
                  <p className="text-gray-400 text-sm mt-2">คลิกที่รายชื่อด้านซ้าย</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

