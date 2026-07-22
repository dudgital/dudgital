import { NextResponse } from 'next/server'

export function middleware() {
  // existing custom auth gate
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next).*)'] }
