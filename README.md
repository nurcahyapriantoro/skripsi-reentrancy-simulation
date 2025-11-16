# Simulasi dan Mitigasi Serangan Reentrancy (Skripsi PoC)

Repository ini berisi *Proof of Concept* (PoC) teknis untuk usulan penelitian skripsi S1.

Proyek ini mendemonstrasikan "Gap Masalah" (kerentanan *Reentrancy*) dan "Usulan Metodologi" (pola mitigasi) dalam lingkungan laboratorium terkontrol menggunakan Hardhat.

---

## 1. 🚨 Gap Masalah: Pola "Interaksi-sebelum-Efek"

"Gap Masalah" yang diangkat adalah *developer* yang masih membuat kesalahan logika mendasar saat menulis *smart contract*, yang mengarah ke kerugian finansial.

* **File:** `contracts/InsecureVault.sol`
* **Keterangan:** Kontrak ini **sengaja dibuat rentan**. Celah keamanan (gap) terletak pada fungsi `withdraw()` yang mengikuti pola "Interaction-before-Effect" (Interaksi-sebelum-Efek).
* **Logika Salah:** Kontrak mengirim Ether (`msg.sender.call`) *sebelum* memperbarui saldo internal (`balances[msg.sender] = 0;`).

---

## 2. 🛡️ Usulan Metodologi: Pola "Checks-Effects-Interactions"

"Usulan Metodologi" untuk menyelesaikan gap masalah tersebut adalah dengan menerapkan sebuah "metode formal" atau pola desain baku yang sudah teruji, yaitu **Checks-Effects-Interactions**.

* **File:** `contracts/SecureVault.sol`
* **Keterangan:** Kontrak ini adalah **solusi** untuk gap masalah. Fungsi `withdraw()` telah diperbaiki.
* **Logika Benar (Mitigasi):**
    1.  **Checks:** Cek saldo (`require(amount > 0)`).
    2.  **Effects:** Memperbarui saldo internal DULU (`balances[msg.sender] = 0;`).
    3.  **Interactions:** Baru mengirim Ether (`msg.sender.call{...}`).

---

## 3. 🔬 Metodologi Simulasi (Desain Eksperimen)

Untuk membuktikan gap masalah dan validitas metodologi, sebuah eksperimen terkontrol dirancang menggunakan dua komponen:

### 3.1. Kendaraan Eksploitasi
* **File:** `contracts/Attacker.sol`
* **Keterangan:** Kontrak ini adalah 'kendaraan' untuk mengeksploitasi `InsecureVault`. Ia menggunakan fungsi `receive()` untuk memanggil kembali `withdraw()` secara rekursif (berulang) sebelum `InsecureVault` sempat memperbarui saldo.

### 3.2. Skenario Tes (Laboratorium)
* **File:** `test/attack.test.ts`
* **Keterangan:** Ini adalah "laboratorium" simulasi. *Script* ini menjalankan dua eksperimen secara otomatis untuk membuktikan hipotesis:
    * **Hipotesis 1 (EKS 1):** `InsecureVault` (rentan) HARUS berhasil dikuras habis.
    * **Hipotesis 2 (EKS 2):** `SecureVault` (aman) HARUS berhasil mempertahankan dana dari serangan yang sama.

---

## 4. 📊 Hasil Simulasi (Bukti)

Menjalankan simulasi (`npx hardhat test`) akan memberikan *output* yang membuktikan kedua hipotesis di atas. Ini adalah data primer dari penelitian ini.

```bash
  Reentrancy Attack Simulation
    EKS 1: InsecureVault (Rentan)
     [EKS 1 Setup] InsecureVault & Attacker di-deploy.
     [EKS 1 Setup] Saldo awal 'User' (Korban): 9989.xxxx ETH
     [EKS 1 Setup] Saldo awal Vault: 10.0 ETH
     --- [EKS 1] Memulai Serangan ---
     [Attacker] receive() terpicu! Memanggil 'withdraw()' lagi...
     [Attacker] receive() terpicu! Memanggil 'withdraw()' lagi...
     (11 kali)
     --- [EKS 1] Serangan Selesai ---
     [Hasil EKS 1] Saldo akhir Vault: 0.0 ETH
     [Hasil EKS 1] Saldo akhir Attacker: 11.0 ETH
      ✔ Serangan HARUS BERHASIL (menguras saldo Vault)

============================================================

    EKS 2: SecureVault (Aman)
     [EKS 2 Setup] SecureVault di-deploy.
     [EKS 2 Setup] Saldo awal 'User' (Korban): 9979.xxxx ETH
     [EKS 2 Setup] Saldo awal SecureVault: 10.0 ETH
     [EKS 2 Setup] Kontrak Attacker baru di-deploy (menargetkan SecureVault).
     --- [EKS 2] Memulai Serangan ke SecureVault ---
     [Attacker] receive() terpicu! Memanggil 'withdraw()' lagi...
     --- [EKS 2] Serangan Gagal (Reverted) Sesuai Harapan ---
     [Hasil EKS 2] Saldo akhir SecureVault: 10.0 ETH
     [Hasil EKS 2] Saldo akhir Attacker: 0.0 ETH
      ✔ Serangan HARUS GAGAL pada SecureVault (Reverted)


  2 passing (2s)