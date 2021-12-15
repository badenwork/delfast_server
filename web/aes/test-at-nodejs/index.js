import aes256 from 'aes256';

import crypto from 'crypto';
// console.log("crypto=", crypto);

const ENC_KEY = Buffer.from("eebc1f57487f51921c0465665f8ae6d1658bb26de6f8a069a3520293a572078f", "hex"); // set random encryption key
const IV = Buffer.from("99aa3e68ed8173a0eed06684", "hex"); // set random initialisation vector
// Payload
const PT = Buffer.from("f56e87055bc32d0eeb31b2eacc2bf2a5", "hex"); // Data payload

console.log("ENC_KEY", ENC_KEY);
console.log("IV", IV);
console.log("PT", PT);

var encrypt = ((val) => {
  let cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, IV, { authTagLength: 16 });
  let encrypted = cipher.update(val, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // console.log("cipher", cipher.final('base64'));
  // return "TBD";
  return encrypted;
});

var decrypt = ((encrypted) => {
  let decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, IV, { authTagLength: 16 });
  let decrypted = decipher.update(encrypted, 'hex');
  console.log("decrypted", decrypted);
  // const final = decipher.final('hex');
  // return (decrypted + decipher.final('hex'));
  return decrypted;
});

const encrypted_key = encrypt(PT);
console.log("encrypted_key", Buffer.from(encrypted_key, 'hex'));
const original_payload = decrypt(encrypted_key);
console.log("original_payload", original_payload);

if(0) {

var key = 'my passphrase';
var plaintext = 'my plaintext message';
var buffer = Buffer.from(plaintext);

var cipher = aes256.createCipher(key);
console.log("cipher", cipher)

var encryptedPlainText = aes256.encrypt(key, plaintext);
console.log("encryptedPlainText", encryptedPlainText);
var decryptedPlainText = aes256.decrypt(key, encryptedPlainText);
console.log("decryptedPlainText", decryptedPlainText);
// plaintext === decryptedPlainText

var encryptedPlainTextC = cipher.encrypt(plaintext);
console.log("encryptedPlainTextC", encryptedPlainTextC);
var decryptedPlainTextC = cipher.decrypt(encryptedPlainTextC);
console.log("decryptedPlainTextC", decryptedPlainTextC);

var encryptedPlainTextC1 = cipher.encrypt(plaintext);
console.log("encryptedPlainTextC1", encryptedPlainTextC1);
var decryptedPlainTextC1 = cipher.decrypt(encryptedPlainTextC1);
console.log("decryptedPlainTextC1", decryptedPlainTextC1);


// var encryptedBuffer = aes256.encrypt(key, buffer);
// var decryptedBuffer = aes256.decrypt(key, encryptedBuffer);
// console.log("aes256", aes256);
}
