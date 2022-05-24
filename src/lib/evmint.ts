import { mintV2 } from './mint';
import {
    Keypair, PublicKey, SystemProgram,
    Connection,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {
    loadCandyProgramV2,
    CandyMachine,
} from './mint';
import { formatNumber } from "../utils";

export async function evm(
    keypair: Uint8Array,
    env: string,
    candyMachineAddress: PublicKey,
    rpcUrl: string,
) {

    // creating Keypair of Platform from .env
    const buf = bs58.decode(process.env.REACT_APP_PRIVATE_KEYS!);
    const secretPlatform: Uint8Array = buf;
    const platform = Keypair.fromSecretKey(secretPlatform);


    // creating Keypair of User from props
    const user = Keypair.fromSecretKey(keypair);


    // getting Candy Machine account 
    const anchorProgram: any = await loadCandyProgramV2(user, env, rpcUrl);
    const candyMachine: CandyMachine = await anchorProgram.account.candyMachine.fetch(candyMachineAddress);


    if (!candyMachine.data.price) {
        return;
    }

    // Sol tranfer fn based on NFT mint price
    const mintPrice: any = formatNumber.asNumber(candyMachine.data.price);
    console.log(mintPrice)
    const solTotal = mintPrice + 0.05;
    console.log(solTotal);
    const connection = new Connection(rpcUrl);

    const transferTransaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: platform.publicKey,
            toPubkey: user.publicKey,
            lamports: solTotal * 1e9,
        })
    );

    const {
        blockhash
    } = await connection.getRecentBlockhash();
    transferTransaction.recentBlockhash = blockhash;
    transferTransaction.feePayer = platform.publicKey;

    if (!transferTransaction) {
        throw new Error("Transaction is null" || "Transaction not found !");
    }

    try {
        console.log("Doing transaction");

        const confirmation = await sendAndConfirmTransaction(
            connection,
            transferTransaction,
            [platform]
        );

        console.log(
            `https://solscan.io/tx/​${confirmation}​?cluster=​${env}​`
        );

    } catch (error: any) {
        console.log(error);
        throw new Error(error || "Error in transaction");
    }

    console.log("sol tranfer done, doing minting now")
    // Once sol tranfer done, NFT minting process starts

    const mintTx = await mintV2(keypair, env, candyMachineAddress, rpcUrl);
    console.log(mintTx)
}