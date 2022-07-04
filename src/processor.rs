// use std::{borrow::BorrowMut, fmt::rt::v1::Count};
use borsh::BorshDeserialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};

use crate::instruction::EchoInstruction;

use crate::error::EchoError;
pub struct Processor;

impl Processor {
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        // if !echo_buffer.data_is_empty() {
        //     // throw error if the echo_buffer isn't empty
        //     return Err(EchoError::NonZeroEcho.into()); // why this error
        // }
        msg!("Process echo");
        Self::process_echo(program_id, accounts, &instruction_data)?;
        Ok(())
    }

    fn process_echo(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> Result<(), ProgramError> {
        msg!("In the process_echo function");
        let data = EchoInstruction::try_from_slice(instruction_data)?;
        match data {
            EchoInstruction::Echo { data } => {
                msg!("Inside the Echo function");
                let accounts_iter = &mut accounts.iter();
                let &mut echo_buffer = &mut next_account_info(accounts_iter)?; // passing in the keypair pubkey
                msg!(&format!("{:?}", &data));

                // todo : check that there is no data

                // immutable reference
                let echo_data_size = echo_buffer.data_len();

                // mutable reference
                let mut data_f = echo_buffer.try_borrow_mut_data()?;

                data_f.copy_from_slice(&data[..echo_data_size]);
            }
            EchoInstruction::InitializeAuthorizedEcho {
                buffer_seed,
                buffer_size,
            } => {
                let accounts_iter = &mut accounts.iter();
                let authority = &mut next_account_info(accounts_iter)?;
                let authorized_buffer = &mut next_account_info(accounts_iter)?;

                // find the PDA
                msg!(&format!("{}", buffer_seed));
                let (authorized_buffer_key, bump_seed) = Pubkey::find_program_address(
                    &[
                        b"authority",
                        authority.key.as_ref(),
                        &buffer_seed.to_le_bytes(),
                    ],
                    program_id,
                );

                if authorized_buffer_key != *authorized_buffer.key {
                    msg!("PDA key not equal to authorized_buffer pubkey! FUCK!");
                };

                // CPI call to make the account for some reason getting error that I'm missing account
                invoke_signed(
                    &system_instruction::create_account(
                        authority.key,
                        &authorized_buffer_key,
                        Rent::get()?.minimum_balance(buffer_size),
                        buffer_size as u64,
                        program_id,
                    ),
                    &[authority.clone(), authorized_buffer.clone()],
                    // last item is always bump seed
                    &[&[
                        b"authority",
                        &authority.key.as_ref(),
                        &buffer_seed.to_le_bytes(),
                        &[bump_seed],
                    ]],
                )?;
                msg!("created the account!");

                let mut data_f = authorized_buffer.try_borrow_mut_data()?;

                // get into le bytes to save!
                let le_buffer_seeds = buffer_seed.to_le_bytes();

                // update the data!
                data_f[..1].copy_from_slice(&[[bump_seed]][0]);
                data_f[1..9].copy_from_slice(&le_buffer_seeds);
                msg!("Data is copied into first 9 bytes.");
            }

            EchoInstruction::AuthorizedEcho { data, buffer_seed } => {
                let accounts_iter = &mut accounts.iter();
                let authority = &mut next_account_info(accounts_iter)?;
                let authorized_buffer = &mut next_account_info(accounts_iter)?;
                // what is the objective here? : copy data vector into the authorized_buffer account

                // deterministically find the PDA
                let (authorized_buffer_key, bump_seed) = Pubkey::find_program_address(
                    &[
                        b"authority",
                        authority.key.as_ref(),
                        &buffer_seed.to_le_bytes(),
                    ],
                    program_id,
                );

                /*
                make sure that PDA pubkey, which was derived using a seed which includes the authority key, matches
                the authorized_buffer.key --> this required me to pass in the buffer seed!
                 */

                if authorized_buffer_key != *authorized_buffer.key {
                    msg!("The PDA account pubkey does not match the key of the account that was passsed in");
                    return Err(EchoError::IncorrectAuthority.into());
                };

                // immutable reference
                if authorized_buffer.data_len() > data.len() {
                    let copy_limit = data.len();

                    //mutable reference
                    let mut data_f = authorized_buffer.try_borrow_mut_data()?;

                    // zero out all of the data aside from the first 9 bytes
                    for elem in &mut data_f[9..] {
                        *elem = 0;
                    }

                    // start at index 9 and copy the data.
                    data_f[9..].clone_from_slice(&data[..copy_limit]);
                    msg!("You did it!");
                } else {
                    let copy_limit = authorized_buffer.data_len();

                    //mutable reference
                    let mut data_f = authorized_buffer.try_borrow_mut_data()?;

                    // zero out all of the data aside from the first 9 bytes
                    for elem in &mut data_f[9..] {
                        *elem = 0;
                    }

                    // start at index 9 and copy the data.
                    data_f[9..].clone_from_slice(&data[..copy_limit]);
                    msg!("You did it!");
                }
            }
            _ => return Err(ProgramError::InvalidInstructionData),
        }
        Ok(())
    }
}
