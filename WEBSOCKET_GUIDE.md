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

## Replacing REST API Calls

### 1. Get All Tickets
**Instead of:** `GET /api/v1/tickets`

```javascript
// WebSocket approach
socket.emit('tickets:getAll', (response) => {
  if (response.success) {
    console.log('Tickets:', response.data);
  } else {
    console.error('Error:', response.error);
  }
});
```

### 2. Get User's Tickets
**Instead of:** `GET /api/v1/tickets/user/:userId`

```javascript
// WebSocket approach
const userId = 'user-uuid-here';
socket.emit('tickets:getUserTickets', userId, (response) => {
  if (response.success) {
    console.log('User tickets:', response.data);
  } else {
    console.error('Error:', response.error);
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

Listen for real-time events to update your dashboard automatically:

### 1. New Ticket Created
```javascript
socket.on('ticket:created', (data) => {
  console.log('New ticket created:', data.ticket);
  // Update your ticket list in real-time
  addTicketToList(data.ticket);
});
```

### 2. Ticket Status Changed
```javascript
socket.on('ticket:statusChanged', (data) => {
  console.log(`Ticket ${data.ticketId} status changed to ${data.newStatus}`);
  // Update ticket status in your UI
  updateTicketStatus(data.ticketId, data.newStatus);
});
```

### 3. New Comment Added
```javascript
socket.on('ticket:commentAdded', (data) => {
  console.log('New comment on ticket:', data.ticketId);
  // Update comments section
  addCommentToTicket(data.ticketId, data.comment);
});
```

### 4. Ticket Assigned
```javascript
socket.on('ticket:assigned', (data) => {
  console.log(`Ticket ${data.ticketId} assigned to ${data.assigneeName}`);
  // Update assignee in UI
  updateTicketAssignee(data.ticketId, data.assigneeName);
});

// Personal notification when assigned to you
socket.on('ticket:assignedToYou', (data) => {
  console.log('A ticket has been assigned to you!');
  // Show notification
  showNotification('New ticket assigned to you');
});
```

## Complete React Example

```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function TicketDashboard() {
  const [tickets, setTickets] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    setSocket(newSocket);

    // Get initial tickets
    newSocket.emit('tickets:getAll', (response) => {
      if (response.success) {
        setTickets(response.data);
      }
    });

    // Listen for real-time updates
    newSocket.on('ticket:created', (data) => {
      setTickets(prev => [data.ticket, ...prev]);
    });

    newSocket.on('ticket:statusChanged', (data) => {
      setTickets(prev => prev.map(ticket => 
        ticket.id === data.ticketId 
          ? { ...ticket, status: data.newStatus }
          : ticket
      ));
    });

    newSocket.on('ticket:assigned', (data) => {
      setTickets(prev => prev.map(ticket => 
        ticket.id === data.ticketId 
          ? { ...ticket, assignee: { name: data.assigneeName } }
          : ticket
      ));
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div>
      <h1>Ticket Dashboard (Real-time)</h1>
      {tickets.map(ticket => (
        <div key={ticket.id}>
          <h3>{ticket.title}</h3>
          <p>Status: {ticket.status}</p>
          <p>Priority: {ticket.priority}</p>
          <p>Assignee: {ticket.assignee?.name || 'Unassigned'}</p>
        </div>
      ))}
    </div>
  );
}

export default TicketDashboard;
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