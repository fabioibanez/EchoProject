const {
    Connection,
    sendAndConfirmTransaction,
    Keypair,
    Transaction,
    SystemProgram,
    PublicKey,
    TransactionInstruction,
  } = require("@solana/web3.js");
  // redundant? Ask Jarry
  const web3 = require('solana/web3.js');
  const BN = require("bn.js"); // Borsh Serialization

  const main = async () => {
    // 1st arg is node 2nd arg is file name --> slice at 2 to get what we need
    var args = process.argv.slice(2);
    const programId = new PublicKey(args[0]);
    const buffer_seed = new Buffer.Number(args[1]);
    const buffer_size = new Buffer.Number(args[0]); // usize type will rust automatically assign this a type? 

    //accounts that are a part of the smart contract
    const authority = Keypair.generate();
    const authorized_buffer = Keypair.generate();
    
    // connection to devnet Allows us to access commands from JSON RPC API
    const connection = new Connection("https://api.devnet.solana.com/");

    // fund the authority account
    console.log("Requesting Airdrop of 1 SOL...");
    await connection.requestAirdrop(authority.publicKey, 2e9);
    console.log("Airdrop received");

    // get the data in a way where i can pass it into the actual instruction: buffer_seed and buffer_size
    // no fcuking idea.
    const uint8 = new Uint8Array (1);
    uint8[0] = buffer_seed;
    let u8array_buffer_size = new Uint8Array(buffer_size);

    let initializeAuthEchoIx = new TransactionInstruction({
      keys: [
        {
        pubkey: authorized_buffer.pubkey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: authority.pubkey,
        isSigner: true,
        isWritable: true, 
      },
      {
        pubkey: SystemProgram.pubkey,
        isSigner: false,
        isWritable: false, 
      },
    ],
      programId: programId,
      data: [uint8[0], u8array_buffer_size],
      // need to pass in the buffer size and the buffer seed,
    });

    let txid = await sendAndConfirmTransaction (
      connection,
      initializeAuthEchoIx,
      [SystemProgram, authority, authorized_buffer], // accounts
    );
    
    console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);
    data = (await connection.getAccountInfo(authorized_buffer.publicKey)).data;
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