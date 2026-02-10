export function checkRateLimit(ip: string, endpoint: string = 'default'): { allowed: boolean; remaining: number; resetIn: number } {
  return { allowed: true, remaining: 999999, resetIn: 0 };
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}
