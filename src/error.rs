use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Debug, Copy, Clone, PartialEq)]
pub enum EchoError {
    #[error("Non Zero Data in Echo Buffer account")]
    NonZeroEcho,
    #[error("Incorrect authority passed in")]
    IncorrectAuthority,
}

impl From<EchoError> for ProgramError {
    fn from(e: EchoError) -> Self {
        ProgramError::Custom(e as u32)
    }
}