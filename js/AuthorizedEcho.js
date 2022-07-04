/*
What to I have to accomplish/do here?
1. pass in the authority and authorized_buffer account
2. authorized_buffer is a PDA so you have to create the PDA and pass in the PDA here. 
*/
const {
    Connection,
    sendAndConfirmTransaction,
    Keypair,
    Transaction,
    SystemProgram,
    PublicKey,
    TransactionInstruction,
} = require("@solana/web3.js");

const BN = require('bn.js');

const main = async () => {
    const connection = new Connection("https://api.devnet.solana.com/");

    var args = process.argv.slice(2);
    const programId = new PublicKey(args[0]);
    const authorized_echo = "any message"

    const buffer_seed = new BN(50).toBuffer('le', 8);
    const buffer_size = new BN(20).toBuffer('le', 8);

    // these are our two accounts
    const authority = Keypair.generate();
    let PDAseeds = [
        Buffer.from('authority', 'utf-8'),
        authority.publicKey.toBuffer(),
        buffer_seed]

    // finding the PDA pubkey
    const vectorWithPDAB = await PublicKey.findProgramAddress(PDAseeds, programId);
    const authorized_buffer = vectorWithPDAB[0];

    console.log("Requesting Airdrop of 1 SOL...");
    await connection.requestAirdrop(authority.publicKey, 2e9);
    console.log("Airdrop received");

    const init_idx = Buffer.from(new Uint8Array([1]));
    const write_idx = Buffer.from(new Uint8Array([2]));

    const messageLen = Buffer.from(new Uint8Array((new BN(authorized_echo.length)).toArray("le", 4)));
    const message = Buffer.from(authorized_echo, "ascii");

    let initializeAuthEchoIx = new TransactionInstruction({
        keys: [
            {
                pubkey: authority.publicKey,
                isSigner: true,
                isWritable: false,
            },
            {
                pubkey: authorized_buffer,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
        ],
        programId: programId,
        data: Buffer.concat([init_idx, buffer_seed, buffer_size]),
    })

    let writeAuthBufferIx = new TransactionInstruction({
        keys: [
            {
                pubkey: authority.publicKey,
                isSinger: true,
                isWritable: false,
            },
            {
                pubkey: authorized_buffer,
                isSinger: false,
                isWritable: true,
            },
        ],
        programId: programId,
        data: Buffer.concat([write_idx, messageLen, message, buffer_seed])
    })

    let tx2 = new Transaction();
    tx2.add(initializeAuthEchoIx).add(writeAuthBufferIx);

    let txid2 = await sendAndConfirmTransaction(
        connection,
        tx2,
        [authority],
        {
            skipPreflight: true,
            preflightCommitment: "confirmed",
            confirmation: "confirmed",
        }
    );
    
    console.log(`https://explorer.solana.com/tx/${txid2}?cluster=devnet`);
    data = (await connection.getAccountInfo(authorized_buffer)).data;
    console.log("Authorized Buffer Data:", data.toString());
}
main()
    .then(() => {
        console.log("Success");
    })
    .catch((e) => {
        console.error(e);
    });