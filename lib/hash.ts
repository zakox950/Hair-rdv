/**
 * Hashes an IP address using SHA-256 via the Web Crypto API.
 * No external library — works in both Node.js (≥18) and Edge runtimes.
 */
export async function hashIP(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT ?? 'default-salt-change-in-production';
  const data = new TextEncoder().encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
