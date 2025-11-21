// src/app/dashboard/messages/page.tsx
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
  sender?: {
    id: string
    email: string
    user_metadata: {
      first_name?: string
      last_name?: string
      role?: string
    }
  }
  receiver?: {
    id: string
    email: string
    user_metadata: {
      first_name?: string
      last_name?: string
      role?: string
    }
  }
}

type Contact = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  unread_count?: number
}

export default function MessagesPage() {
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
      const userRole = user.user_metadata?.role

      // Load contacts based on role
      let contactsList: Contact[] = []

      if (userRole === 'superadmin') {
        // Superadmins can message all students
        const { data: students } = await supabase
          .from('students')
          .select('user_id, first_name, last_name')

        if (students) {
          const studentContacts = students
            .filter(s => s.user_id)
            .map(s => ({
              id: s.user_id,
              email: '',
              first_name: s.first_name,
              last_name: s.last_name,
              role: 'student'
            }))
          contactsList.push(...studentContacts)
        }

        // Superadmins can message all teachers
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

        // Superadmins can message other superadmins
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
      } else if (userRole === 'teacher') {
        // Teachers can message all students
        const { data: students } = await supabase
          .from('students')
          .select('user_id, first_name, last_name')

        if (students) {
          const studentContacts = students
            .filter(s => s.user_id)
            .map(s => ({
              id: s.user_id,
              email: '',
              first_name: s.first_name,
              last_name: s.last_name,
              role: 'student'
            }))
          contactsList.push(...studentContacts)
        }

        // Teachers can message other teachers
        const { data: teachers } = await supabase
          .from('teachers')
          .select('user_id, first_name, last_name')
          .neq('user_id', user.id)

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

        // Teachers can message superadmins
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
      } else if (userRole === 'student') {
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ข้อความ</h1>
        <p className="text-muted-foreground mt-1">
          ส่งข้อความและติดต่อสื่อสาร
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-6rem)]">
        {/* Contacts List */}
        <Card className="flex flex-col h-full">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-xl">รายชื่อ</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                ไม่พบรายชื่อ
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${selectedContact?.id === contact.id ? 'bg-muted' : ''
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold truncate">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{contact.role}</p>
                  </div>
                  {contact.unread_count! > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {contact.unread_count}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex flex-col h-full lg:col-span-2">
          {selectedContact ? (
            <>
              <CardHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                    {selectedContact.first_name.charAt(0)}{selectedContact.last_name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </CardTitle>
                    <CardDescription className="capitalize text-xs">
                      {selectedContact.role}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1 h-full overflow-hidden">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      ยังไม่มีข้อความ
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSender = msg.sender_id === currentUser.id
                      return (
                        <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isSender
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                            }`}>
                            <p className="text-sm break-words">{msg.message}</p>
                            <div className="flex items-center gap-1 mt-1 justify-end opacity-70">
                              <p className="text-[10px]">
                                {new Date(msg.created_at).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {isSender && msg.is_read && (
                                <CheckCheck className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      placeholder="พิมพ์ข้อความ..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">เลือกรายชื่อเพื่อเริ่มสนทนา</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
