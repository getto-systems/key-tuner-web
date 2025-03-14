# key-tuner

A tool for generating secure passwords

## Overview

Key Tuner is a secure password generation tool using Rust/WebAssembly. The frontend is built with Vite, and the backend logic is implemented in Rust.

## Features

- Fast and secure password generation with Rust
- Browser execution via WebAssembly
- Customizable password settings
  - Adjustable length
  - Inclusion settings for uppercase/lowercase letters, numbers, and symbols
- Simple and user-friendly UI

## Security

Key Tuner is designed with security as a top priority. The following security measures are implemented:

- **Client-side Processing**: All password generation is performed within the user's browser, and generated passwords are not sent to any server.
- **WebAssembly Isolation**: Core functionality is implemented in Rust and compiled to WebAssembly, ensuring high performance and security.
- **Open Source**: The code is published under the GPL-3.0 license, allowing for community auditing.
- **Minimal Dependencies**: External dependencies are kept to a minimum to reduce the risk of supply chain attacks.
- **No Data Collection**: Key Tuner does not collect or store user data.

### Vulnerability Reporting

If you discover a security vulnerability, please report it to shun@getto.systems with "[Key Tuner Security]" in the subject line. Include details of the vulnerability, steps to reproduce, and potential impact.

For critical security vulnerabilities, we aim to provide a fix within 72 hours. Security updates are announced on the project repository and website.

For the full security policy, please visit: [Security Policy](https://key-tuner.getto.systems/security-policy.html)

## Project Structure

```
key-tuner/
├── crates/                     # Rust crates
│   ├── core/                   # Core logic (password generation, etc.)
│   └── web/                    # Web-oriented WASM implementation
├── references/                 # Reference implementations
│   └── tune.sh                 # Original bash script for password generation
├── web/                        # Web frontend
│   ├── public/                 # Static files
│   ├── src/                    # Source code
│   │   ├── assets/            # Images, fonts, etc.
│   │   ├── js/                # JavaScript code
│   │   ├── styles/            # CSS files
│   │   └── index.html         # Main HTML
│   └── tests/                  # Frontend tests
└── scripts/                    # Build and deployment scripts
```

## Development Environment Setup

### Required Tools

- [Rust](https://www.rust-lang.org/) (1.70.0 or higher)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [Node.js](https://nodejs.org/) (18.x or higher)
- [npm](https://www.npmjs.com/) (9.x or higher)

### Setup Steps

1. Clone the repository

```bash
git clone https://github.com/yourusername/key-tuner.git
cd key-tuner
```

2. Install dependencies

```bash
npm install
cargo install wasm-pack
```

3. Build WASM

```bash
npm run build:wasm
```

4. Start the development server

```bash
npm run dev
```

You can now access the application at http://localhost:3000.

## Build Process

To create a production build:

```bash
npm run build:wasm
npm run build
```

The build output will be in the `web/dist` directory.

## Deployment

The application is deployed to the following URL pattern:

```
https://key-tuner.getto.systems/{VERSION}/index.html
```

Where `{VERSION}` is the version number from the `.release-version` file.

### CI/CD Deployment

The application is automatically built and deployed when a new version is released. The deployment process is handled by GitLab CI/CD and configured in the `.gitlab-ci.yml` file.

The deployment process:

1. Reads the version from `.release-version`
2. Builds the application with the version-specific path
3. Deploys the built files to the production server

## Testing

To run tests:

```bash
npm run test
```

This will run both Rust and JavaScript tests.

## License

key-tuner is released under the [GPL-3.0](LICENSE) license.

This project includes a Rust language port of the cksum command from GNU coreutils. This implementation is provided under the terms of the GPL-3.0 license.

Copyright &copy; since 2025 shun@getto.systems
