import { jwtVerify, createRemoteJWKSet } from 'jose';

export interface CloudflareAccessPayload {
  email: string;
  name?: string;
  sub: string; // Cloudflare user ID
  iat: number;
  exp: number;
}

/**
 * Validates a Cloudflare Access JWT token
 * @param token - The JWT token from the Cf-Access-Jwt-Assertion header
 * @param teamDomain - Your Cloudflare Access team domain (e.g., "your-team.cloudflareaccess.com")
 * @param aud - Your Access Application Audience (AUD) tag
 * @returns The validated JWT payload
 */
export async function validateAccessJWT(
  token: string,
  teamDomain: string,
  aud: string
): Promise<CloudflareAccessPayload> {
  try {
    // Cloudflare Access uses JWKS for token validation
    const JWKS = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`)
    );

    const { payload } = await jwtVerify(token, JWKS, {
      audience: aud,
      issuer: `https://${teamDomain}`,
    });

    return payload as unknown as CloudflareAccessPayload;
  } catch (error) {
    throw new Error(`Invalid Cloudflare Access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts the Cloudflare Access JWT from request headers
 * @param request - The incoming request
 * @returns The JWT token or null if not found
 */
export function getAccessToken(request: Request): string | null {
  return request.headers.get('Cf-Access-Jwt-Assertion');
}
