import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// Load environment variables
const RPC_URL = process.env.RPC_URL; // Polygon RPC (Alchemy/Infura)
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Wallet private key
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Smart contract address

const ABI_PATH = "./abi.json"; // Path to ABI file
const ABI = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));
// Connect to Polygon network
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Function to call the smart contract
async function callSmartContract() {
    try {
        console.log("Checking round data...");

        const currentRound = await contract.getCurrentRound();
        const previousRound = Number(currentRound) - 1;
        if (previousRound <= 0) {
            console.log("No previous round found, skipping drawLottery.");
            return;
        }
        const roundData = await contract.getRoundData(previousRound);

        // Check if the winning number is set and the round is not drawn
        if (roundData.isWinNumberSet && !roundData.isDrawed && roundData.players.length > 0) {
            console.log("Conditions met, calling drawLottery...");

            const tx = await contract.drawLottery(previousRound);
            console.log(`Transaction sent: ${tx.hash}`);

            await tx.wait();
            console.log("Transaction confirmed.");
        } else {
            console.log("Conditions not met, skipping drawLottery.");
        }
    } catch (error) {
        console.error("Error executing contract function:", error);
    }
}

// Run the function every 1 minutes (600,000 ms)
const INTERVAL = 1 * 60 * 1000;
setInterval(callSmartContract, INTERVAL);

console.log("DailyLottery background service started...");