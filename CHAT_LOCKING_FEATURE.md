# Chat Locking Feature Documentation

## Overview
The Chat Locking feature prevents multiple organization members from accessing the same chat simultaneously. When one user opens a chat, it becomes locked for 5 minutes (with automatic extension via heartbeat), preventing other members from editing it.

## Architecture

### Backend Components

#### 1. Chat Model (`backend/models/chat.js`)
**New Fields:**
- `isLocked`: Boolean - Indicates if chat is currently locked
- `lockedBy`: ObjectId - References the user who has the lock
- `lockedAt`: Date - Timestamp when lock was acquired
- `lockExpiry`: Date - Calculated expiry time (lockedAt + 5 minutes)

#### 2. Chat Controller (`backend/controller/chat.js`)

**Modified Functions:**

**`getChat()`**
- Populates `lockedBy` field with user details
- Checks if chat is locked by another user
- Auto-unlocks expired locks (>5 minutes old)
- Returns HTTP 423 (Locked) if unavailable
- Returns lock status in response

**New Functions:**

**`lockChat(req, res)`**
- **Route:** `POST /chat/:chatId/lock`
- **Purpose:** Acquire exclusive lock on chat
- **Process:**
  1. Validates chat exists in user's active organization
  2. Checks for existing lock by another user
  3. Sets lock fields with current timestamp
  4. Emits Socket.IO event to organization room
- **Response:**
  - 200: Lock acquired successfully
  - 423: Already locked by another user
  - 404: Chat not found

**`unlockChat(req, res)`**
- **Route:** `POST /chat/:chatId/unlock`
- **Purpose:** Release lock on chat
- **Process:**
  1. Verifies user owns the lock
  2. Clears all lock fields
  3. Emits Socket.IO event to organization room
- **Response:**
  - 200: Unlocked successfully
  - 403: User doesn't own the lock

**`keepChatLockAlive(req, res)`**
- **Route:** `POST /chat/:chatId/lock/heartbeat`
- **Purpose:** Extend lock duration
- **Process:**
  1. Verifies user owns the lock
  2. Updates `lockedAt` and `lockExpiry` to current time + 5 minutes
- **Heartbeat Interval:** Every 2 minutes (frontend)
- **Response:**
  - 200: Lock extended with new expiry time
  - 403: User doesn't own the lock

#### 3. Socket.IO Service (`backend/services/socket.js`)

**Enhanced Connection Handler:**
```javascript
// Join user to organization rooms
user.organizations.forEach(org => {
  socket.join(`org:${org.orgId._id}`);
});
```

**Disconnect Handler:**
```javascript
socket.on('disconnect', async () => {
  // Find all chats locked by this user
  const lockedChats = await Chat.find({ lockedBy: userId, isLocked: true });
  
  // Unlock all chats
  await Chat.updateMany(
    { lockedBy: userId, isLocked: true },
    { isLocked: false, lockedBy: null, lockedAt: null, lockExpiry: null }
  );
  
  // Notify organization members
  lockedChats.forEach(chat => {
    io.to(`org:${chat.organization}`).emit('chat-unlocked', {
      chatId: chat._id,
      reason: 'user-disconnected'
    });
  });
});
```

**Socket Events:**
- `chat-locked`: Emitted when chat is locked
  ```javascript
  { chatId, lockedBy: { username, fullName } }
  ```
- `chat-unlocked`: Emitted when chat is unlocked
  ```javascript
  { chatId, reason: 'user-closed' | 'user-disconnected' | 'expired' }
  ```

### Frontend Components

#### 1. ChatInterface Component (`frontend/src/components/ChatInterface.jsx`)

**New State Variables:**
- `chatLockStatus`: Object - Maps chatId to lock status `{isLocked, lockedBy}`
- `currentChatLocked`: Boolean - Is the active chat locked?
- `currentChatLockedBy`: Object - User who has the lock `{username, fullName}`
- `socket`: Socket.IO client instance
- `lockHeartbeatRef`: Ref for heartbeat interval

**Socket.IO Integration:**

**Connection Setup:**
```javascript
useEffect(() => {
  const newSocket = io(BASE_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
  
  setSocket(newSocket);
  
  // Listen for chat-locked events
  newSocket.on('chat-locked', (data) => {
    setChatLockStatus(prev => ({
      ...prev,
      [data.chatId]: { isLocked: true, lockedBy: data.lockedBy }
    }));
  });
  
  // Listen for chat-unlocked events
  newSocket.on('chat-unlocked', (data) => {
    setChatLockStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[data.chatId];
      return newStatus;
    });
  });
  
  return () => newSocket.close();
}, [activeChatId]);
```

**Lock Management:**
```javascript
useEffect(() => {
  if (!activeChatId || isTemporaryChat) return;

  // Lock chat on open
  const lockChat = async () => {
    const response = await fetch(`${BASE_URL}/chat/${activeChatId}/lock`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      // Start heartbeat
      lockHeartbeatRef.current = setInterval(async () => {
        await fetch(`${BASE_URL}/chat/${activeChatId}/lock/heartbeat`, {
          method: 'POST',
          credentials: 'include',
        });
      }, 2 * 60 * 1000); // Every 2 minutes
    } else if (response.status === 423) {
      // Chat is locked
      const data = await response.json();
      setCurrentChatLocked(true);
      setCurrentChatLockedBy(data.lockedBy);
    }
  };

  lockChat();

  // Cleanup: Unlock on unmount
  return () => {
    if (lockHeartbeatRef.current) {
      clearInterval(lockHeartbeatRef.current);
    }
    
    fetch(`${BASE_URL}/chat/${activeChatId}/unlock`, {
      method: 'POST',
      credentials: 'include',
    });
  };
}, [activeChatId, isTemporaryChat]);
```

**UI Components:**

**Chat List Lock Indicator:**
```jsx
{isLocked ? (
  <Lock size={16} className="text-amber-500" 
    title={`Locked by ${lockedBy?.fullName || lockedBy?.username}`} />
) : (
  <MessageSquare size={16} className="text-purple-500" />
)}
{isLocked && (
  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
    In use
  </span>
)}
```

**Locked Chat Banner:**
```jsx
{currentChatLocked && currentChatLockedBy && (
  <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
    <Lock size={20} className="text-amber-600" />
    <p className="text-sm font-medium text-amber-900">
      This chat is currently in use by {currentChatLockedBy.fullName}
    </p>
    <p className="text-xs text-amber-700">
      You can view the chat but cannot send messages until they close it.
    </p>
  </div>
)}
```

**Disabled Input:**
```jsx
<textarea
  disabled={userCredits < 2 || currentChatLocked}
  placeholder={
    currentChatLocked 
      ? "Chat is locked by another user..." 
      : "Type your message here..."
  }
/>
```

## User Flow

### Scenario 1: User A Opens Chat
1. User A clicks on a chat in the list
2. Frontend calls `POST /chat/:chatId/lock`
3. Backend sets lock fields and emits `chat-locked` event
4. All organization members see lock icon on that chat
5. Frontend starts 2-minute heartbeat interval
6. User A can send messages normally

### Scenario 2: User B Tries to Access Locked Chat
1. User B clicks on the same chat
2. Frontend calls `POST /chat/:chatId/lock`
3. Backend returns HTTP 423 (Locked) with lock owner info
4. Frontend shows locked banner and disables input
5. User B can view messages but cannot send

### Scenario 3: User A Closes Chat
1. User A navigates away or closes tab
2. Component unmounts, calls `POST /chat/:chatId/unlock`
3. Backend clears lock fields and emits `chat-unlocked` event
4. Heartbeat interval is cleared
5. All users see lock icon disappear
6. User B can now access the chat

### Scenario 4: User A Disconnects (Network/Browser Crash)
1. Socket.IO detects disconnect
2. Server finds all chats locked by User A
3. Server unlocks all chats automatically
4. Server emits `chat-unlocked` events to organization rooms
5. All users see lock icons disappear

### Scenario 5: Lock Expires (5 Minutes)
1. User A has been inactive for >5 minutes
2. User B tries to access the chat
3. Backend checks lock expiry in `getChat()`
4. Lock is expired, auto-unlocked
5. User B's lock request succeeds
6. User A's next heartbeat fails (no longer owner)

## API Endpoints

### POST /chat/:chatId/lock
**Purpose:** Acquire exclusive lock on chat

**Request:**
- Headers: Cookie with authentication token
- Params: `chatId` - MongoDB ObjectId

**Response (200):**
```json
{
  "message": "Chat locked successfully",
  "lockExpiry": "2024-01-15T10:35:00.000Z"
}
```

**Response (423):**
```json
{
  "message": "Chat is currently locked by another user",
  "lockedBy": {
    "username": "john_doe",
    "fullName": "John Doe"
  },
  "lockExpiry": "2024-01-15T10:35:00.000Z"
}
```

### POST /chat/:chatId/unlock
**Purpose:** Release lock on chat

**Request:**
- Headers: Cookie with authentication token
- Params: `chatId` - MongoDB ObjectId

**Response (200):**
```json
{
  "message": "Chat unlocked successfully"
}
```

**Response (403):**
```json
{
  "message": "You do not have permission to unlock this chat"
}
```

### POST /chat/:chatId/lock/heartbeat
**Purpose:** Extend lock duration by 5 minutes

**Request:**
- Headers: Cookie with authentication token
- Params: `chatId` - MongoDB ObjectId

**Response (200):**
```json
{
  "message": "Lock extended successfully",
  "lockExpiry": "2024-01-15T10:40:00.000Z"
}
```

**Response (403):**
```json
{
  "message": "You do not own the lock on this chat"
}
```

## Testing Checklist

### Basic Locking
- [ ] User can open a chat and it locks successfully
- [ ] Lock icon appears in sidebar for other users
- [ ] Other users see "In use" badge on locked chat
- [ ] Locked chat shows warning banner when accessed
- [ ] Input is disabled for other users

### Heartbeat Mechanism
- [ ] Heartbeat sends every 2 minutes
- [ ] Lock extends to current time + 5 minutes
- [ ] Console shows "Lock heartbeat sent"
- [ ] Lock doesn't expire while user is active

### Unlocking
- [ ] Chat unlocks when user navigates away
- [ ] Chat unlocks when user closes tab
- [ ] Lock icon disappears for all users immediately
- [ ] Other users can access chat after unlock

### Auto-Unlock on Disconnect
- [ ] Close browser/tab → Chats auto-unlock
- [ ] Network disconnect → Chats auto-unlock within 30s
- [ ] Kill browser process → Chats auto-unlock
- [ ] Socket disconnect event fires properly

### Lock Expiry
- [ ] Lock expires after 5 minutes without heartbeat
- [ ] Other user can acquire lock after expiry
- [ ] Expired lock auto-unlocks in getChat()
- [ ] Original user's heartbeat fails after expiry

### Edge Cases
- [ ] Two users click chat simultaneously → One gets 423
- [ ] User refreshes page → Lock released and reacquired
- [ ] User switches organization → Locks cleared
- [ ] Temporary chat (New Chat) → No locking applied
- [ ] Chat deleted while locked → Lock cleaned up

### Real-time Updates
- [ ] Lock status updates immediately via Socket.IO
- [ ] Multiple users see consistent lock state
- [ ] No race conditions with rapid lock/unlock
- [ ] Organization room events reach all members

## Security Considerations

1. **Authentication:** All lock endpoints require authentication
2. **Authorization:** Users can only lock chats in their active organization
3. **Ownership Verification:** Only lock owner can unlock or extend
4. **Auto-Expiry:** Prevents indefinite locks (5-minute timeout)
5. **Organization Isolation:** Socket events scoped to organization rooms
6. **Lock Cleanup:** Disconnect handler prevents orphaned locks

## Performance Optimizations

1. **Heartbeat Interval:** 2 minutes (not too frequent)
2. **Lock Duration:** 5 minutes (balanced between timeout and UX)
3. **Socket.IO Rooms:** Efficient event targeting by organization
4. **Populate Lock Owner:** Only username and fullName (minimal data)
5. **Lock Status Cache:** Frontend maintains chatLockStatus map

## Future Enhancements

1. **Lock Queue:** Allow users to request notification when chat becomes available
2. **Force Unlock:** Admin capability to unlock any chat
3. **Lock History:** Track who accessed chat and when
4. **Customizable Timeout:** Organization-level lock duration settings
5. **Collaborative Editing:** Multiple users with conflict resolution
6. **Lock Extension Warning:** Notify user before lock expires
7. **Activity Indicator:** Show typing status across users

## Troubleshooting

### Issue: Lock doesn't release on tab close
**Solution:** Check that component cleanup is called. Test with React DevTools.

### Issue: Heartbeat fails
**Solution:** Check network tab for 403 errors. Verify lock ownership.

### Issue: Socket events not received
**Solution:** Verify user is in organization room. Check Socket.IO connection status.

### Issue: Lock expires too quickly
**Solution:** Increase heartbeat frequency or lock duration.

### Issue: Multiple locks on same chat
**Solution:** Check for race conditions. Ensure atomic lock acquisition.

## Dependencies

- **Backend:** mongoose, socket.io, express
- **Frontend:** react, socket.io-client, lucide-react
- **Database:** MongoDB (Chat model with lock fields)
- **Real-time:** Socket.IO server and client

## Environment Variables

No new environment variables required. Uses existing:
- `VITE_BASE_API_URL` (Frontend)
- MongoDB connection string (Backend)

---

**Implementation Date:** January 2024  
**Version:** 1.0  
**Status:** ✅ Complete
