import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const host=request.headers.get('host') || '';
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))return new NextResponse('UX Planner is a local application.',{status:403});
  const origin=request.headers.get('origin');
  if(origin && origin!==`http://${host}`)return new NextResponse('Cross-origin requests are not allowed.',{status:403});
  return NextResponse.next();
}
