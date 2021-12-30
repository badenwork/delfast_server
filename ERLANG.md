Use last erlang.
Now is a 24.2

```
~/.kerl/bin/kerl update releases
~/.kerl/bin/kerl build 24.2
~/.kerl/bin/kerl install 24.2 ~/.kerl/installs/24.2
. /home/baden/.kerl/installs/24.2/activate
```

Ok. Example of GCM.

Encrypt:

```erlang
Key = <<1:256>>. % Key length 32 bytes
IV = <<0:128>>. % IV length ≥ 1 byte
Text = <<"Hello">>. % Any length
AAD = <<>>. % AAD any length, here 0 byte
{CipherText, Tag} = crypto:crypto_one_time_aead(aes_256_gcm, Key, IV, Text, AAD, true). % Tag length 1-16, here using default 16
{CipherText, Tag1} = crypto:crypto_one_time_aead(aes_256_gcm, Key, IV, Text, AAD, 12, true). % Use 12 byte tag
```

Decrypt:

```erlang
Key = <<1:256>>.
IV = <<0:128>>.
CipherText = <<254,190,31,199,21>>.
Tag = <<26,210,128,46,78,47,171,160,82,197,153,57,151,240,254,209>>.
AAD = <<>>.
Text = crypto:crypto_one_time_aead(aes_256_gcm, Key, IV, CipherText, AAD, Tag, false).
```

From OTP 22.0, the new crypto API crypto:crypto_one_time_aead replaces
the obsolete crypto:block_encrypt and crypto:block_decrypt
[https://www.erlang.org/doc/apps/crypto/new_api.html#the-new-api].

```erlang
TestClientKey =
 <<16#ad, 16#db, 16#2c, 16#0a, 16#d4, 16#2e, 16#c3, 16#cf,
   16#20, 16#da, 16#dd, 16#52, 16#06, 16#5a, 16#4f, 16#70,
   16#bf, 16#ec, 16#42, 16#33, 16#ff, 16#d0, 16#da, 16#68,
   16#28, 16#36, 16#28, 16#5f, 16#dc, 16#e9, 16#31, 16#19>>.

DecryptedStatus = <<16#02, 16#00, 16#00, 16#00, 16#00, 16#00, 16#00, 16#01, 16#08, 16#00, 16#00, 16#00>>.

CalculatedNonce = <<16#c5, 16#80, 16#b7, 16#2d, 16#66, 16#73, 16#74, 16#62, 16#a4, 16#da, 16#3b, 16#4c>>.

AAD = <<>>.

{CipherText, Tag} = crypto:crypto_one_time_aead(aes_256_gcm, TestClientKey, CalculatedNonce, DecryptedStatus, AAD, true).
% {<<218,197,90,219,9,107,109,113,17,23,170,58>>,  <<145,227,190,95,24,48,162,193,169,6,178,45,57,41,182,90>>}
%     da  c5 5a  db 09 6b  6d  71 11 17 aa  3a        91  e3  be 5f 18 30  a2  c1  a9 06 b2 2d 39 29  b6 5a
```
