import { expect } from "chai";
import hre, { network } from "hardhat";
import { Signer } from "ethers";

// Kita definisikan variabel di luar agar bisa diakses
let ethersRef: any;
const toEth = (val: any) => ethersRef.formatEther(val);
const toWei = (val: string) => ethersRef.parseEther(val);

describe("Reentrancy Attack Simulation", function () {
    // Definisi variabel utama
    let deployer: any, user: any, attackerSigner: any;
    let victimVault: any, attackerContract: any, secureVault: any;
    let deployerAddress: string, userAddress: string, attackerAddress: string;

    // Hook 'before' ini hanya berjalan sekali untuk seluruh tes
    before(async function () {
        // Setup koneksi ethers
        const connection = await network.connect();
        ethersRef = connection.ethers;

        // Dapatkan akun-akun yang akan digunakan
        [deployer, user, attackerSigner] = await ethersRef.getSigners();
        [deployerAddress, userAddress, attackerAddress] = await Promise.all([
            deployer.getAddress(),
            user.getAddress(),
            attackerSigner.getAddress()
        ]);
    });

    // ============================================================
    // == EKSperimen 1: SERANGAN PADA KONTRAK RENTAN
    // ============================================================
    describe("EKS 1: InsecureVault (Rentan)", function () {
        
        // 'before' ini hanya berjalan untuk EKS 1
        before(async function () {
            // Deploy kontrak korban
            const VictimVaultFactory = await ethersRef.getContractFactory("InsecureVault", deployer);
            victimVault = await VictimVaultFactory.deploy();
            await victimVault.waitForDeployment();

            // 'User' (korban) deposit 10 ETH
            await victimVault.connect(user).deposit({ value: toWei("10.0") });

            // Deploy kontrak penyerang
            const AttackerFactory = await ethersRef.getContractFactory("Attacker", attackerSigner);
            attackerContract = await AttackerFactory.deploy(await victimVault.getAddress());
            await attackerContract.waitForDeployment();
            
            console.log("   [EKS 1 Setup] InsecureVault & Attacker di-deploy.");
            console.log(`   [EKS 1 Setup] Saldo awal 'User' (Korban): ${toEth(await ethersRef.provider.getBalance(userAddress))} ETH`);
            console.log(`   [EKS 1 Setup] Saldo awal Vault: ${toEth(await victimVault.getBalance())} ETH`);
        });

        it("Serangan HARUS BERHASIL (menguras saldo Vault)", async function () {
            console.log("   --- [EKS 1] Memulai Serangan ---");
            
            await attackerContract.connect(attackerSigner).attack({
                value: toWei("1.0") // Penyerang "memancing" dengan 1 ETH
            });

            console.log("   --- [EKS 1] Serangan Selesai ---");

            let finalVaultBalance = await victimVault.getBalance();
            let finalAttackerBalance = await ethersRef.provider.getBalance(await attackerContract.getAddress());

            console.log(`   [Hasil EKS 1] Saldo akhir Vault: ${toEth(finalVaultBalance)} ETH`);
            console.log(`   [Hasil EKS 1] Saldo akhir Attacker: ${toEth(finalAttackerBalance)} ETH`);

            // Verifikasi (Assert)
            expect(finalVaultBalance).to.equal(toWei("0.0"));
            expect(finalAttackerBalance).to.equal(toWei("11.0"));
        });

        // ============================================================
        // == PERBAIKAN KOSMETIK ADA DI SINI ==
        // ============================================================
        // Kita tambahkan blok 'after' untuk mencetak garis SETELAH EKS 1 selesai
        after(async function () {
            console.log("\n" + "=".repeat(60) + "\n");
        });
        // ============================================================
    });

    // ============================================================
    // == EKSperimen 2: SERANGAN PADA KONTRAK AMAN
    // ============================================================
    describe("EKS 2: SecureVault (Aman)", function () {

        // 'before' ini hanya berjalan untuk EKS 2
        before(async function () {
            // ============================================================
            // == PERBAIKAN KOSMETIK ADA DI SINI ==
            // == Baris 'console.log("===")' sudah DIHAPUS dari sini ==
            // ============================================================

            // Deploy kontrak AMAN
            const SecureVaultFactory = await ethersRef.getContractFactory("SecureVault", deployer);
            secureVault = await SecureVaultFactory.deploy();
            await secureVault.waitForDeployment();

            // 'User' (korban) deposit 10 ETH
            await secureVault.connect(user).deposit({ value: toWei("10.0") });
            
            console.log("   [EKS 2 Setup] SecureVault di-deploy.");
            console.log(`   [EKS 2 Setup] Saldo awal 'User' (Korban): ${toEth(await ethersRef.provider.getBalance(userAddress))} ETH`);
            console.log(`   [EKS 2 Setup] Saldo awal SecureVault: ${toEth(await secureVault.getBalance())} ETH`);

            // Deploy kontrak penyerang BARU, targetkan SecureVault
            const AttackerFactory = await ethersRef.getContractFactory("Attacker", attackerSigner);
            attackerContract = await AttackerFactory.deploy(await secureVault.getAddress());
            await attackerContract.waitForDeployment();
            console.log("   [EKS 2 Setup] Kontrak Attacker baru di-deploy (menargetkan SecureVault).");
        });

        it("Serangan HARUS GAGAL pada SecureVault (Reverted)", async function () {
            console.log("   --- [EKS 2] Memulai Serangan ke SecureVault ---");

            // Verifikasi (Assert) bahwa serangan GAGAL
            await expect(
                attackerContract.connect(attackerSigner).attack({
                    value: toWei("1.0")
                })
            ).to.be.rejectedWith("Failed to send Ether"); // Ini adalah pesan error yang kita harapkan

            console.log("   --- [EKS 2] Serangan Gagal (Reverted) Sesuai Harapan ---");

            let finalSecureVaultBalance = await secureVault.getBalance();
            let finalAttackerBalance = await ethersRef.provider.getBalance(await attackerContract.getAddress());

            console.log(`   [Hasil EKS 2] Saldo akhir SecureVault: ${toEth(finalSecureVaultBalance)} ETH`);
            console.log(`   [Hasil EKS 2] Saldo akhir Attacker: ${toEth(finalAttackerBalance)} ETH`);

            // Verifikasi (Assert) bahwa saldo aman
            expect(finalSecureVaultBalance).to.equal(toWei("10.0")); 
            let attackerBalanceInVaultAfterAttack = await secureVault.balances(await attackerContract.getAddress());
            expect(attackerBalanceInVaultAfterAttack).to.equal(toWei("0.0")); 
        });
    });
});