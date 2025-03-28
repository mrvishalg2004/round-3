import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for handling socket.io connections
export function middleware(request: NextRequest) {
  // Patch for Socket.IO - allow websocket upgrades on the socketio path
  if (request.nextUrl.pathname.startsWith('/api/socketio')) {
    // Don't process middleware for socketio path
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  }

  return NextResponse.next();
}

// Configure the paths this middleware will run on
export const config = {
  matcher: ['/api/socketio/:path*'],
}; 