const {
  Connection,
  sendAndConfirmTransaction,
  Keypair,
  Transaction,
  SystemProgram,
  PublicKey,
  TransactionInstruction,
} = require("@solana/web3.js");
const BN = require("bn.js"); // Big Number

const main = async () => {
  // 1st arg is node 2nd arg is file name --> slice at 2 to get what we need
  var args = process.argv.slice(2);
  const programId = new PublicKey(args[0]);

  // authority account
  const authority = Keypair.generate();

  //get the data that I'm going to pass in hereu
  const idx = Buffer.from(new Uint8Array([1]));
  let buffer_seed = new BN(50).toBuffer('le', 8);
  let buffer_size = new BN(50).toBuffer('le', 8);

  let PDAseeds = [
    Buffer.from('authority', 'utf-8'),
    authority.publicKey.toBuffer(),
    buffer_seed
  ];
  //PDA Account
  // asynch promise return type so await so that we can actually get the pubkey back!
  const vectorWithPDAB = await PublicKey.findProgramAddress(PDAseeds, programId);
  const authorized_buffer = vectorWithPDAB[0];

  // connection to devnet Allows us to access commands from JSON RPC API
  const connection = new Connection("https://api.devnet.solana.com/");

  // fund the authority account
  console.log("Requesting Airdrop of 1 SOL...");
  await connection.requestAirdrop(authority.publicKey, 2e9);
  console.log("Airdrop received");

  //do .toString() console.log wants strings!
  console.log(authority.publicKey.toString())
  console.log(authorized_buffer.toString())
  console.log(SystemProgram.programId.toString())
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
    data: Buffer.concat([idx, buffer_seed, buffer_size]),
    // need to pass in the buffer size and the buffer seed,
  });

  let tx = new Transaction();
  tx.add(initializeAuthEchoIx);

  let txid = await sendAndConfirmTransaction(
    connection,
    tx,
    [authority], // signer accounts only!
    {
      skipPreflight: true,
      preflightCommitment: "confirmed",
      confirmation: "confirmed",
    }
  );

  console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);
  data = (await connection.getAccountInfo(authorized_buffer)).data;
  console.log("Authorized Buffer Data:", data);
};
// calling main

main()
  .then(() => {
    console.log("Success");
  })
  .catch((e) => {
    console.error(e);
  });