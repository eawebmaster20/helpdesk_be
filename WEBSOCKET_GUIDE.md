# WebSocket Implementation for Helpdesk Tickets

This document explains how to use the WebSocket connections for real-time ticket operations instead of REST APIs.

## Setup

### Backend
The WebSocket server is automatically started with the Express server on the same port (default: 3000).

### Frontend (Client)
Install Socket.IO client:
```bash
npm install socket.io-client
```

## Authentication

All WebSocket connections require JWT authentication:

```javascript
import io from 'socket.io-client';

// Connect with authentication token
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here' // Token from login response
  }
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

## Efficient Room-Based Real-time Data Flow

### 1. Subscribe to All Tickets (Admin/Manager Dashboard)
**Instead of:** `GET /api/v1/tickets`

```javascript
// ✅ EFFICIENT APPROACH - Subscribe to admin dashboard updates
socket.emit('tickets:subscribeToAll'); // Subscribe to all tickets room

socket.on('tickets:allList', (response) => {
  if (response.success) {
    console.log('All tickets for admin dashboard:', response.data);
    updateAdminDashboard(response.data);
  }
});

// 🔄 LEGACY APPROACH (still available)
socket.emit('tickets:getAll', (response) => {
  if (response.success) {
    console.log('Tickets:', response.data);
  }
});
```

### 2. Subscribe to User's Tickets (Personal Dashboard)
**Instead of:** `GET /api/v1/tickets/user/:userId`

```javascript
// ✅ EFFICIENT APPROACH - Subscribe to personal dashboard updates
socket.emit('tickets:subscribeToMine'); // Subscribe to your tickets room

socket.on('tickets:myList', (response) => {
  if (response.success) {
    console.log('My tickets:', response.data);
    updatePersonalDashboard(response.data);
  }
});

// 🔄 LEGACY APPROACH (still available)
const userId = 'user-uuid-here';
socket.emit('tickets:getUserTickets', userId, (response) => {
  if (response.success) {
    console.log('User tickets:', response.data);
  }
});
```

### 3. Get Single Ticket
**Instead of:** `GET /api/v1/tickets/:id`

```javascript
// WebSocket approach
const ticketId = 'ticket-uuid-here';
socket.emit('tickets:getById', ticketId, (response) => {
  if (response.success) {
    console.log('Ticket:', response.data);
  } else {
    console.error('Error:', response.error);
  }
});
```

### 4. Get Ticket Activities
**Instead of:** `GET /api/v1/tickets/:id/activities`

```javascript
// WebSocket approach
const ticketId = 'ticket-uuid-here';
socket.emit('tickets:getActivities', ticketId, (response) => {
  if (response.success) {
    console.log('Activities:', response.data);
  } else {
    console.error('Error:', response.error);
  }
});
```

## Real-time Updates

### ✅ NEW APPROACH: Room-Based Efficient Updates

Different dashboards subscribe to different rooms and only receive relevant data:

```javascript
// Admin Dashboard - receives ALL tickets
socket.emit('tickets:subscribeToAll');
socket.on('tickets:allList', (response) => {
  if (response.success) {
    console.log('Admin dashboard - all tickets updated:', response.data);
    updateAdminDashboard(response.data);
  }
});

// Personal Dashboard - receives only YOUR tickets
socket.emit('tickets:subscribeToMine'); 
socket.on('tickets:myList', (response) => {
  if (response.success) {
    console.log('Personal dashboard - your tickets updated:', response.data);
    updatePersonalDashboard(response.data);
  }
});
```

### Benefits:
- 🔐 **Security**: Users only receive tickets they're authorized to see
- ⚡ **Performance**: No unnecessary data transfer
- 📊 **Scalability**: Server only sends relevant data to each client
- 🎯 **Targeted**: Room-based updates for different user types

### 🔄 LEGACY EVENTS (Still Available)

These individual events are still emitted for specific notifications:

```javascript
// Personal notification when assigned to you
socket.on('ticket:assignedToYou', (data) => {
  console.log('A ticket has been assigned to you!');
  showNotification('New ticket assigned to you');
});

// Individual ticket creation notification for creator
socket.on('ticket:created', (data) => {
  console.log('Your ticket was created:', data.ticket);
  showNotification('Your ticket has been created successfully');
});
```

## Complete React Examples

### Admin Dashboard (All Tickets)

```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function AdminTicketDashboard() {
  const [allTickets, setAllTickets] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    setSocket(newSocket);

    // Subscribe to ALL tickets (admin view)
    newSocket.emit('tickets:subscribeToAll');

    // Listen for all tickets updates (admin only)
    newSocket.on('tickets:allList', (response) => {
      if (response.success) {
        console.log(`Admin received ${response.data.length} tickets`);
        setAllTickets(response.data);
      }
    });

    return () => newSocket.close();
  }, []);

  return (
    <div>
      <h1>Admin Dashboard - All Tickets ({allTickets.length})</h1>
      {allTickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

### Personal Dashboard (My Tickets Only)

```jsx
function PersonalTicketDashboard() {
  const [myTickets, setMyTickets] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    setSocket(newSocket);

    // Subscribe to MY tickets only (personal view)
    newSocket.emit('tickets:subscribeToMine');

    // Listen for personal tickets updates
    newSocket.on('tickets:myList', (response) => {
      if (response.success) {
        console.log(`Personal received ${response.data.length} tickets`);
        setMyTickets(response.data);
      }
    });

    // Personal notifications
    newSocket.on('ticket:assignedToYou', (data) => {
      showNotification('A ticket has been assigned to you!');
    });

    newSocket.on('ticket:created', (data) => {
      showNotification('Your ticket has been created successfully!');
    });

    return () => newSocket.close();
  }, []);

  return (
    <div>
      <h1>My Tickets Dashboard ({myTickets.length})</h1>
      {myTickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

### Shared Ticket Card Component

```jsx
function TicketCard({ ticket }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
      <h3>{ticket.ticket_number}: {ticket.title}</h3>
      <p>Status: <strong>{ticket.status}</strong></p>
      <p>Priority: <strong>{ticket.priority}</strong></p>
      <p>Department: {ticket.department?.name}</p>
      <p>Category: {ticket.category?.name}</p>
      <p>Assignee: {ticket.assignee?.name || 'Unassigned'}</p>
      <p>Created by: {ticket.created_by.name}</p>
      <small>Created: {new Date(ticket.created_at).toLocaleString()}</small>
    </div>
  );
}

function showNotification(message) {
  // Your notification implementation
  alert(message); // Replace with proper toast/notification
}
```

### Role-Based Dashboard Router

```jsx
function TicketDashboardRouter({ userRole }) {
  if (userRole === 'admin' || userRole === 'manager') {
    return <AdminTicketDashboard />;
  } else {
    return <PersonalTicketDashboard />;
  }
}
```

## Benefits of WebSocket Implementation

1. **Real-time Updates**: Dashboard updates automatically without page refresh
2. **Reduced Server Load**: No polling required
3. **Better User Experience**: Instant notifications and updates
4. **Efficient Data Transfer**: Only send updates when data changes
5. **Scalable**: Handles multiple concurrent users efficiently

## Migration Strategy

1. **Phase 1**: Keep existing REST APIs running alongside WebSocket
2. **Phase 2**: Update frontend components one by one to use WebSocket
3. **Phase 3**: Once all components are migrated, deprecate REST endpoints
4. **Phase 4**: Remove unused REST endpoints after testing period

## Error Handling

Always handle WebSocket errors gracefully:

```javascript
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  // Fallback to REST API if needed
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
  // Attempt reconnection or show offline message
});
```