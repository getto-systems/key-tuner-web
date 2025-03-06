# key-tuner-core

`key-tuner-core` is a Rust crate that provides core logic for password generation.

## Overview

This crate generates deterministic and secure passwords based on user-specified inputs such as passphrase, service name, and version. The same inputs will always produce the same password, eliminating the need to memorize passwords as they can be regenerated when needed.

## Main Features

- Multiple password generation modes
  - `Ex`: Extended passwords containing uppercase, lowercase, numbers, and symbols
  - `Full`: Passwords containing uppercase, lowercase, numbers, and symbols (retained for backward compatibility)
  - `Short`: Passwords containing only lowercase letters and numbers
- Input settings validation
- Detailed error handling

## Usage Example

```rust
use key_tuner_core::{PasswordGenerator, PasswordSettings};

// Create password settings
let settings = PasswordSettings {
    pass_phrase: "my passphrase".to_string(),
    service_name: "example.com".to_string(),
    version: "1".to_string(),
    mode: "ex".to_string(),
    length: "16".to_string(),
};

// Validate settings
if let Err(error) = PasswordGenerator::validate_settings(&settings) {
    println!("Settings error: {:?}", error);
    return;
}

// Generate password
match PasswordGenerator::generate(&settings) {
    Ok(password) => println!("Generated password: {}", password),
    Err(error) => println!("Password generation error: {:?}", error),
}
```

## Technical Details

The password generation process follows these steps:

1. Validation of input parameters (passphrase, service name, version)
2. Calculation and summation of CRC-32 checksums for each input string
3. Multiplication of the sum by the length to create a seed
4. Selection of character sets based on the chosen mode
5. Generation of a password with the specified length using the seed

## Module Structure

- `crypto`: Cryptography-related functionality such as checksum calculation
- `password`: Core functionality for password generation and validation
  - `data`: Data structures for password settings
  - `error`: Error type definitions
  - `generator`: Password generation logic
  - `validation`: Input validation logic

## License

This crate is provided under the GPL-3.0 license. For more details, please refer to the LICENSE file in the project.

Note that `crates/core/src/crypto/cksum.rs` is a port of the `cksum` command from GNU coreutils.