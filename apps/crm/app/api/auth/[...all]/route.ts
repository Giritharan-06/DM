import { auth } from '@zyroz/auth';
import { toNextJsHandler } from 'better-auth/next-js';
export async function GET(req: Request) {
  return toNextJsHandler(auth()).GET(req);
}
export async function POST(req: Request) {
  return toNextJsHandler(auth()).POST(req);
}
