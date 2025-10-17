# Chat Locking Testing Checklist

## Pre-Testing Setup

- [ ] Backend server is running
- [ ] Frontend is running
- [ ] MongoDB is connected
- [ ] At least 2 users exist in the system
- [ ] Both users are members of the same organization
- [ ] Socket.IO connection is established (check browser console)

## 1. Basic Lock Acquisition ✅

### Test Case 1.1: Lock a chat
- [ ] Login as User A
- [ ] Click on any chat in the sidebar
- [ ] Check browser console for "Chat locked successfully"
- [ ] **Expected:** Chat opens normally

### Test Case 1.2: Verify lock icon for other users
- [ ] Keep User A's session open with chat active
- [ ] Login as User B in another browser/incognito
- [ ] Navigate to the same organization
- [ ] Look at the chat list
- [ ] **Expected:** 
  - [ ] 🔒 Lock icon appears on the chat
  - [ ] "In use" badge visible
  - [ ] Chat item shows as locked

### Test Case 1.3: Try to access locked chat
- [ ] As User B, click on the locked chat
- [ ] **Expected:**
  - [ ] Warning banner appears: "This chat is currently in use by [User A]"
  - [ ] Input field is disabled
  - [ ] Placeholder says "Chat is locked by another user..."
  - [ ] Send button is disabled
  - [ ] Can still view messages (read-only)

## 2. Heartbeat Mechanism ⏱️

### Test Case 2.1: Verify heartbeat sends
- [ ] As User A, keep chat open
- [ ] Open browser DevTools → Network tab
- [ ] Filter for "heartbeat"
- [ ] Wait 2 minutes
- [ ] **Expected:**
  - [ ] POST request to `/chat/:chatId/lock/heartbeat` appears
  - [ ] Response is 200 OK
  - [ ] Console shows "Lock heartbeat sent"
  - [ ] Heartbeat continues every 2 minutes

### Test Case 2.2: Verify lock doesn't expire with heartbeat
- [ ] As User A, keep chat open for 6+ minutes
- [ ] Ensure heartbeats are sending (check console)
- [ ] As User B, try to access the chat at 6-minute mark
- [ ] **Expected:**
  - [ ] Chat is still locked
  - [ ] User B gets 423 error
  - [ ] Lock persists as long as heartbeat continues

## 3. Manual Unlock 🔓

### Test Case 3.1: Unlock by navigating away
- [ ] As User A, open a locked chat
- [ ] Click on a different chat in sidebar
- [ ] Check network tab for unlock request
- [ ] As User B, check if lock icon disappeared
- [ ] **Expected:**
  - [ ] POST request to `/chat/:chatId/unlock` sent
  - [ ] Response is 200 OK
  - [ ] Lock icon disappears for User B immediately
  - [ ] User B can now access the chat

### Test Case 3.2: Unlock by clicking "New Chat"
- [ ] As User A, open a locked chat
- [ ] Click "New Chat" button
- [ ] As User B, verify lock is released
- [ ] **Expected:** Same as 3.1

### Test Case 3.3: Unlock by closing tab
- [ ] As User A, open a locked chat
- [ ] Close the browser tab/window completely
- [ ] Wait 2-3 seconds
- [ ] As User B, verify lock icon disappeared
- [ ] **Expected:**
  - [ ] Socket disconnect event triggers
  - [ ] Chat is auto-unlocked
  - [ ] Lock icon disappears
  - [ ] User B can access

## 4. Auto-Unlock on Disconnect 🔌

### Test Case 4.1: Browser crash simulation
- [ ] As User A, lock 2-3 chats
- [ ] Force-kill the browser process (Task Manager/Activity Monitor)
- [ ] As User B, wait 5-10 seconds
- [ ] Refresh User B's page
- [ ] **Expected:**
  - [ ] All User A's locked chats are unlocked
  - [ ] Lock icons disappear
  - [ ] User B can access all chats

### Test Case 4.2: Network disconnect
- [ ] As User A, lock a chat
- [ ] Turn off WiFi/disconnect network
- [ ] As User B, wait 30 seconds
- [ ] **Expected:**
  - [ ] Socket.IO detects disconnect (~20-30s)
  - [ ] Chat is auto-unlocked
  - [ ] Lock icon disappears for User B

### Test Case 4.3: Multiple locked chats
- [ ] As User A, lock 5 different chats (open each briefly)
- [ ] Close browser
- [ ] As User B, check all chats
- [ ] **Expected:**
  - [ ] All 5 chats are unlocked
  - [ ] No orphaned locks remain

## 5. Lock Expiry (5 Minutes) ⏰

### Test Case 5.1: Stop heartbeat manually
- [ ] As User A, open a chat
- [ ] Open DevTools → Network tab
- [ ] Use "Block request pattern" to block `/heartbeat` requests
- [ ] Wait 5+ minutes
- [ ] As User B, try to access the chat
- [ ] **Expected:**
  - [ ] User B's lock request succeeds
  - [ ] Chat is now locked by User B
  - [ ] User A sees lock icon (if still open)

### Test Case 5.2: Natural expiry
- [ ] As User A, lock a chat but don't interact
- [ ] Minimize browser but don't close
- [ ] Wait 5+ minutes (heartbeat should stop if tab inactive)
- [ ] As User B, try to access
- [ ] **Expected:**
  - [ ] Lock has expired
  - [ ] User B can acquire lock
  - [ ] GET request auto-unlocks expired lock

## 6. Real-Time Updates 🔄

### Test Case 6.1: Instant lock notification
- [ ] Have User A and User B on chat list page
- [ ] As User A, click a chat
- [ ] Watch User B's screen
- [ ] **Expected:**
  - [ ] Lock icon appears INSTANTLY (< 1 second)
  - [ ] No page refresh needed
  - [ ] "In use" badge appears

### Test Case 6.2: Instant unlock notification
- [ ] User A has chat locked
- [ ] User B is viewing chat list
- [ ] User A navigates away
- [ ] **Expected:**
  - [ ] Lock icon disappears INSTANTLY
  - [ ] Badge removed
  - [ ] User B can click immediately

### Test Case 6.3: Multiple users in organization
- [ ] Create 3+ users in same organization
- [ ] Have all viewing the same chat list
- [ ] User A locks a chat
- [ ] **Expected:**
  - [ ] ALL users see lock icon
  - [ ] ALL users see "In use" badge
  - [ ] Socket.IO event reaches all organization members

## 7. Edge Cases 🧪

### Test Case 7.1: Race condition (simultaneous clicks)
- [ ] Have User A and User B ready
- [ ] Both click the same chat at exact same time
- [ ] **Expected:**
  - [ ] One user gets 200 OK (acquired lock)
  - [ ] Other user gets 423 Locked
  - [ ] No double-lock occurs
  - [ ] Database has only one lock

### Test Case 7.2: Refresh while locked
- [ ] As User A, lock a chat
- [ ] Refresh the page (F5)
- [ ] **Expected:**
  - [ ] Old lock is released (unmount cleanup)
  - [ ] New lock is acquired (mount effect)
  - [ ] Brief unlock/relock may show in console
  - [ ] No errors occur

### Test Case 7.3: Switch organizations
- [ ] As User A, lock a chat in Org 1
- [ ] Switch to Org 2 using org selector
- [ ] Check if lock is released
- [ ] **Expected:**
  - [ ] Lock in Org 1 is released
  - [ ] Component unmount triggers unlock
  - [ ] User B in Org 1 can access

### Test Case 7.4: Temporary "New Chat"
- [ ] Click "New Chat" (creates temporary chat)
- [ ] Type a message but don't send
- [ ] As User B, check if any locks appear
- [ ] **Expected:**
  - [ ] No lock on temporary chat
  - [ ] Lock only applies to saved chats
  - [ ] No errors in console

### Test Case 7.5: Delete locked chat
- [ ] As User A, lock a chat
- [ ] As admin/same user, delete the chat
- [ ] **Expected:**
  - [ ] Chat deletes successfully
  - [ ] Lock is removed with chat
  - [ ] No orphaned lock references

## 8. UI/UX Verification 🎨

### Test Case 8.1: Lock icon styling
- [ ] Verify lock icon is amber/yellow color
- [ ] Verify "In use" badge has amber background
- [ ] Verify badge text is readable
- [ ] **Expected:** Professional, clear styling

### Test Case 8.2: Warning banner
- [ ] As User B, open locked chat
- [ ] Check banner at top of chat area
- [ ] **Expected:**
  - [ ] Amber/yellow background
  - [ ] Lock icon present
  - [ ] Clear message with user's name
  - [ ] Explains view-only mode

### Test Case 8.3: Disabled input state
- [ ] As User B, view locked chat
- [ ] Try to click in input field
- [ ] Try to type
- [ ] **Expected:**
  - [ ] Input is grayed out
  - [ ] Cursor shows "not-allowed"
  - [ ] Send button is disabled
  - [ ] Placeholder explains why

### Test Case 8.4: Mobile responsiveness
- [ ] Test on mobile device or mobile emulator
- [ ] Lock icon should be visible
- [ ] Badge should fit properly
- [ ] Banner should be readable
- [ ] **Expected:** All elements responsive

## 9. Console & Network Verification 🔍

### Test Case 9.1: No errors in console
- [ ] Open DevTools console
- [ ] Perform all lock/unlock operations
- [ ] **Expected:**
  - [ ] No red errors
  - [ ] Only info/log messages
  - [ ] Socket connection established

### Test Case 9.2: Network requests valid
- [ ] Open DevTools → Network tab
- [ ] Lock a chat
- [ ] Check POST /chat/:id/lock
- [ ] **Expected:**
  - [ ] Status 200 or 423
  - [ ] Response has proper JSON
  - [ ] No 500 errors

### Test Case 9.3: Socket events fire
- [ ] Open DevTools console
- [ ] Filter console for "chat-locked" or "chat-unlocked"
- [ ] Lock/unlock chats
- [ ] **Expected:**
  - [ ] Console shows Socket.IO events
  - [ ] Events have correct data
  - [ ] Events fire in real-time

## 10. Security & Authorization 🔒

### Test Case 10.1: Cannot unlock another user's lock
- [ ] As User A, lock a chat
- [ ] As User B, manually call unlock API
  ```javascript
  fetch('/chat/:chatId/unlock', {method: 'POST', credentials: 'include'})
  ```
- [ ] **Expected:**
  - [ ] 403 Forbidden response
  - [ ] Lock remains active
  - [ ] User A retains lock

### Test Case 10.2: Authentication required
- [ ] Logout
- [ ] Try to access lock endpoints directly
- [ ] **Expected:**
  - [ ] 401 Unauthorized
  - [ ] Redirected to login

### Test Case 10.3: Organization isolation
- [ ] User A in Org 1 locks a chat
- [ ] User C in Org 2 tries to see/access that chat
- [ ] **Expected:**
  - [ ] User C cannot see Org 1's chats
  - [ ] No access to locked chats from other orgs
  - [ ] Socket events scoped to correct organization

## 11. Performance Testing ⚡

### Test Case 11.1: Multiple simultaneous locks
- [ ] Have 5+ users each lock different chats
- [ ] All in same organization
- [ ] **Expected:**
  - [ ] All locks work independently
  - [ ] No performance degradation
  - [ ] All users see correct lock states

### Test Case 11.2: Heartbeat performance
- [ ] Keep 10+ chats locked (multiple users)
- [ ] Monitor server CPU/memory
- [ ] **Expected:**
  - [ ] Heartbeats don't cause spikes
  - [ ] Server handles load well
  - [ ] No memory leaks

### Test Case 11.3: Socket.IO scalability
- [ ] Have 10+ users in same organization
- [ ] Lock/unlock chats rapidly
- [ ] **Expected:**
  - [ ] All users receive events
  - [ ] No event loss
  - [ ] Minimal latency (< 100ms)

## 12. Browser Compatibility 🌐

- [ ] Chrome: All tests pass
- [ ] Firefox: All tests pass
- [ ] Safari: All tests pass
- [ ] Edge: All tests pass
- [ ] Mobile Chrome: Basic tests pass
- [ ] Mobile Safari: Basic tests pass

## Test Results Summary

**Date Tested:** _______________  
**Tested By:** _______________  
**Environment:** [ ] Development [ ] Staging [ ] Production

### Pass/Fail Summary
- Basic Lock Acquisition: _____ / _____
- Heartbeat Mechanism: _____ / _____
- Manual Unlock: _____ / _____
- Auto-Unlock on Disconnect: _____ / _____
- Lock Expiry: _____ / _____
- Real-Time Updates: _____ / _____
- Edge Cases: _____ / _____
- UI/UX: _____ / _____
- Console/Network: _____ / _____
- Security: _____ / _____
- Performance: _____ / _____
- Browser Compatibility: _____ / _____

**Total:** _____ / _____ tests passed

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes
_____________________________________________________
_____________________________________________________
_____________________________________________________

## Quick Smoke Test (5 Minutes)

If you only have time for a quick test:

1. [ ] User A locks chat → Lock icon appears for User B ✅
2. [ ] User B tries to access → Gets warning message ✅
3. [ ] User A closes chat → Lock icon disappears ✅
4. [ ] Heartbeat sends every 2 minutes (check network) ✅
5. [ ] Close browser → Locks auto-released ✅

If all 5 pass, core functionality is working! ✅
