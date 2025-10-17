# Chat Locking System - Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHAT LOCKING SYSTEM OVERVIEW                         │
└─────────────────────────────────────────────────────────────────────────────┘


USER A (Active)                    BACKEND SERVER                   USER B (Viewing)
─────────────                      ──────────────                   ────────────────

   │                                     │                                 │
   │ 1. Opens Chat #123                  │                                 │
   │────────────────────────────────────>│                                 │
   │    POST /chat/123/lock              │                                 │
   │                                     │                                 │
   │                                     │ 2. Set Lock Fields              │
   │                                     │    isLocked: true               │
   │                                     │    lockedBy: userA              │
   │                                     │    lockedAt: now                │
   │                                     │    lockExpiry: now+5min         │
   │                                     │                                 │
   │<────────────────────────────────────│                                 │
   │    200 OK {locked: true}            │                                 │
   │                                     │                                 │
   │                                     │ 3. Emit Socket Event            │
   │                                     │    to org:orgId room            │
   │                                     │────────────────────────────────>│
   │                                     │    chat-locked {chatId, by}     │
   │                                     │                                 │
   │                                     │                                 │ 4. UI Updates
   │                                     │                                 │    🔒 Lock Icon
   │                                     │                                 │    "In use" Badge
   │                                     │                                 │
   │ 5. Start Heartbeat Timer            │                                 │
   │    (every 2 minutes)                │                                 │
   │                                     │                                 │
   ├─ ─ ─ ─ 2 minutes pass ─ ─ ─ ─ ─ ─ ─│                                 │
   │                                     │                                 │
   │ 6. Send Heartbeat                   │                                 │
   │────────────────────────────────────>│                                 │
   │    POST /chat/123/lock/heartbeat    │                                 │
   │                                     │                                 │
   │                                     │ 7. Extend Lock                  │
   │                                     │    lockedAt: now                │
   │                                     │    lockExpiry: now+5min         │
   │                                     │                                 │
   │<────────────────────────────────────│                                 │
   │    200 OK {extended}                │                                 │
   │                                     │                                 │
   ├─ ─ ─ ─ User B tries to access ─ ─ ─│                                 │
   │                                     │                                 │
   │                                     │<────────────────────────────────│
   │                                     │   POST /chat/123/lock           │
   │                                     │                                 │
   │                                     │ 8. Check Lock Status            │
   │                                     │    Already locked by A          │
   │                                     │                                 │
   │                                     │────────────────────────────────>│
   │                                     │   423 LOCKED {lockedBy: A}      │
   │                                     │                                 │
   │                                     │                                 │ 9. Show Warning
   │                                     │                                 │    ⚠️ Banner
   │                                     │                                 │    🚫 Disabled Input
   │                                     │                                 │
   ├─ ─ ─ ─ User A closes chat ─ ─ ─ ─ ─│                                 │
   │                                     │                                 │
   │ 10. Component Unmounts              │                                 │
   │     Stop Heartbeat                  │                                 │
   │                                     │                                 │
   │ 11. Unlock Chat                     │                                 │
   │────────────────────────────────────>│                                 │
   │    POST /chat/123/unlock            │                                 │
   │                                     │                                 │
   │                                     │ 12. Clear Lock Fields           │
   │                                     │     isLocked: false             │
   │                                     │     lockedBy: null              │
   │                                     │     lockedAt: null              │
   │                                     │     lockExpiry: null            │
   │                                     │                                 │
   │<────────────────────────────────────│                                 │
   │    200 OK {unlocked}                │                                 │
   │                                     │                                 │
   │                                     │ 13. Emit Socket Event           │
   │                                     │     to org:orgId room           │
   │                                     │────────────────────────────────>│
   │                                     │    chat-unlocked {chatId}       │
   │                                     │                                 │
   │                                     │                                 │ 14. UI Updates
   │                                     │                                 │     ✅ Remove Lock Icon
   │                                     │                                 │     ✅ Enable Input
   │                                     │                                 │
   │                                     │                                 │ 15. Can Now Lock
   │                                     │<────────────────────────────────│
   │                                     │    POST /chat/123/lock          │
   │                                     │                                 │
   │                                     │────────────────────────────────>│
   │                                     │    200 OK {locked: true}        │
   │                                     │                                 │


┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTO-UNLOCK ON DISCONNECT FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘


USER A (Active)                    BACKEND SERVER                   USER B (Viewing)
─────────────                      ──────────────                   ────────────────

   │                                     │                                 │
   │ User has Chat #123 locked           │                                 │
   │                                     │                                 │
   │                                     │                                 │
   │ 🔌 Browser Crash / Network Lost     │                                 │
   │ ✖️                                   │                                 │
                                         │                                 │
                                         │ 1. Socket Disconnect Event      │
                                         │    socket.on('disconnect')      │
                                         │                                 │
                                         │ 2. Find Locked Chats            │
                                         │    Chat.find({                  │
                                         │      lockedBy: userA,           │
                                         │      isLocked: true             │
                                         │    })                           │
                                         │                                 │
                                         │ 3. Unlock All Chats             │
                                         │    Chat.updateMany({            │
                                         │      isLocked: false,           │
                                         │      lockedBy: null             │
                                         │    })                           │
                                         │                                 │
                                         │ 4. Emit Socket Events           │
                                         │────────────────────────────────>│
                                         │    chat-unlocked {              │
                                         │      chatId: 123,               │
                                         │      reason: 'user-disconnected'│
                                         │    }                            │
                                         │                                 │
                                         │                                 │ 5. UI Updates
                                         │                                 │    ✅ Remove Lock Icon
                                         │                                 │    ✅ Enable Access
                                         │                                 │


┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCK EXPIRY FLOW (5 MINUTES)                        │
└─────────────────────────────────────────────────────────────────────────────┘


USER A (Inactive)                  BACKEND SERVER                   USER B (Waiting)
─────────────                      ──────────────                   ────────────────

   │                                     │                                 │
   │ Chat locked at 10:00 AM             │                                 │
   │ Last heartbeat: 10:02 AM            │                                 │
   │                                     │                                 │
   │ 😴 User Idle (no heartbeat)         │                                 │
   │                                     │                                 │
   ├─ ─ ─ ─ 5 minutes pass ─ ─ ─ ─ ─ ─ ─│                                 │
   │                                     │                                 │
   │ lockExpiry: 10:07 AM                │                                 │
   │ Current time: 10:08 AM              │                                 │
   │                                     │                                 │
   │                                     │<────────────────────────────────│
   │                                     │   GET /chat/123                 │
   │                                     │                                 │
   │                                     │ 1. Check Lock Status            │
   │                                     │    if (lockExpiry < now) {      │
   │                                     │      // Lock expired!           │
   │                                     │    }                            │
   │                                     │                                 │
   │                                     │ 2. Auto-Unlock Expired Lock     │
   │                                     │    isLocked: false              │
   │                                     │    lockedBy: null               │
   │                                     │                                 │
   │                                     │────────────────────────────────>│
   │                                     │   200 OK {chat, unlocked}       │
   │                                     │                                 │
   │                                     │<────────────────────────────────│
   │                                     │   POST /chat/123/lock           │
   │                                     │                                 │
   │                                     │ 3. New Lock Acquired            │
   │                                     │    lockedBy: userB              │
   │                                     │                                 │
   │                                     │────────────────────────────────>│
   │                                     │   200 OK {locked: true}         │
   │                                     │                                 │


┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Chat Model:
┌─────────────────────────────────────────────────────────────────┐
│ Chat Collection                                                 │
├─────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                   │
│ title: String                                                   │
│ organization: ObjectId (ref: Organization)                      │
│ messages: [{ role, content, timestamp }]                        │
│ createdAt: Date                                                 │
│ updatedAt: Date                                                 │
│                                                                 │
│ ┌─ LOCKING FIELDS (NEW) ─────────────────────────────────────┐ │
│ │ isLocked: Boolean (default: false)                         │ │
│ │ lockedBy: ObjectId (ref: User, default: null)              │ │
│ │ lockedAt: Date (default: null)                             │ │
│ │ lockExpiry: Date (default: null)                           │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        SOCKET.IO ROOM STRUCTURE                             │
└─────────────────────────────────────────────────────────────────────────────┘

Server Rooms:
┌────────────────────────────────────────────────────────┐
│ user:507f1f77bcf86cd799439011                          │  ← Individual user room
│   └─ User A's socket                                   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ org:507f191e810c19729de860ea                           │  ← Organization room
│   ├─ User A's socket                                   │
│   ├─ User B's socket                                   │
│   └─ User C's socket                                   │
└────────────────────────────────────────────────────────┘

Event Emission:
io.to('org:507f191e810c19729de860ea').emit('chat-locked', {...})
   └─> All users in this organization receive the event


┌─────────────────────────────────────────────────────────────────────────────┐
│                            UI COMPONENTS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Sidebar Chat List:
┌───────────────────────────────────────────────────────┐
│ 💬 My Chat Title                                      │  ← Unlocked chat
├───────────────────────────────────────────────────────┤
│ 🔒 Another Chat     [In use]                          │  ← Locked chat
├───────────────────────────────────────────────────────┤
│ 💬 Third Chat                                         │  ← Unlocked chat
└───────────────────────────────────────────────────────┘

Locked Chat Banner:
┌─────────────────────────────────────────────────────────────────┐
│ 🔒 This chat is currently in use by John Doe                    │
│    You can view the chat but cannot send messages until they   │
│    close it.                                                    │
└─────────────────────────────────────────────────────────────────┘

Input Area:
┌─────────────────────────────────────────────────────────────────┐
│ Chat is locked by John Doe                                      │
├─────────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════╗           │
│ ║ Chat is locked by another user...               ║  [Send]   │
│ ╚═══════════════════════════════════════════════════╝           │
│                                                      🚫 Disabled │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend State:
┌────────────────────────────────────────────────────────┐
│ chatLockStatus: {                                      │
│   "chat123": {                                         │
│     isLocked: true,                                    │
│     lockedBy: {                                        │
│       username: "john_doe",                            │
│       fullName: "John Doe"                             │
│     }                                                  │
│   },                                                   │
│   "chat456": {                                         │
│     isLocked: true,                                    │
│     lockedBy: { ... }                                  │
│   }                                                    │
│ }                                                      │
│                                                        │
│ currentChatLocked: false                               │
│ currentChatLockedBy: null                              │
│ lockHeartbeatRef: IntervalID                           │
└────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          TIMING DIAGRAM                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Timeline:
0:00 ─┬─ User opens chat
      │   └─> Lock acquired
      │
2:00 ─┼─ Heartbeat #1 sent
      │   └─> Lock extended to 7:00
      │
4:00 ─┼─ Heartbeat #2 sent
      │   └─> Lock extended to 9:00
      │
6:00 ─┼─ Heartbeat #3 sent
      │   └─> Lock extended to 11:00
      │
8:00 ─┼─ User closes chat
      │   └─> Lock released
      │
      │
Alternative: No heartbeat after 2:00
      │
7:00 ─┼─ Lock expires (2:00 + 5min)
      │   └─> Auto-unlocked on next access
      │


Legend:
─────
  │   = Active lock
  ┼   = Event
  ─   = Timeline
```
