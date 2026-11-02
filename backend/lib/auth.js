import { createRemoteJWKSet, jwtVerify } from 'jose';
let jwks;
function config() {
  const value = { jwksUrl:String(process.env.OW_CENTRAL_JWKS_URL || ''), issuer:String(process.env.OW_CENTRAL_ISSUER || ''), audience:String(process.env.OW_CENTRAL_AUDIENCE || '') };
  return { ...value, ready:Boolean(value.jwksUrl && value.issuer && value.audience) };
}
export function authConfiguration() { return config(); }
export async function requireAuth(req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) throw Object.assign(new Error('Sign in is required.'), { statusCode:401 });
  const auth = config();
  if (!auth.ready) throw Object.assign(new Error('OW Central authentication is not configured.'), { statusCode:503 });
  try {
    if (!jwks) jwks = createRemoteJWKSet(new URL(auth.jwksUrl));
    const { payload } = await jwtVerify(header.slice(7), jwks, { issuer:auth.issuer, audience:auth.audience });
    if (!payload.sub) throw new Error('Missing subject');
    return { subject:payload.sub, email:String(payload.email || ''), displayName:String(payload.name || payload.preferred_username || '') };
  } catch { throw Object.assign(new Error('Your session is invalid or expired. Please sign in again.'), { statusCode:401 }); }
}
