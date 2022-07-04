# EchoProject
Solana Bootcamp Echo Project - Chicago HackerHouse by Jarry Xiao

## Instruction 0: Echo
Contents of the passed in data vector should be copied into the echo_buffer account

## Instruction 1: Initialized Authorized Echo
Create authorized buffer account
1. Find PDA
Note: I passed in the buffer_seed here, need to make the fix and get the buffer seed from the first 9 bytes

## Instruction 2: Authorized Echo
instruction allows the authority account write to the authorized_buffer account (PDA account), where authority PK is a seed
