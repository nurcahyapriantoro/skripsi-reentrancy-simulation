# Skripsi: Simulasi & Mitigasi Serangan Reentrancy

Ini adalah repository untuk simulasi teknis (Proof of Concept) usulan penelitian skripsi.

### 1. Gap Masalah (Kontrak Rentan)
- `contracts/InsecureVault.sol`

### 2. Metodologi Eksploitasi (Penyerang)
- `contracts/Attacker.sol`

### 3. Usulan Metodologi (Mitigasi)
- `contracts/SecureVault.sol`

### 4. Metodologi Simulasi (Bukti)
- `test/attack.test.ts`

## Cara Menjalankan Ulang Tes
1. Clone repo ini
2. Jalankan `npm install`
3. Jalankan `npx hardhat test`