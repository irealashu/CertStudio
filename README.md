# CertStudio

CertStudio is a browser-based X.509 certificate generator and PKI toolkit for creating, inspecting, and exporting certificates locally in the browser.

It supports generating self-signed certificates, root/intermediate CA certificates, CA-signed leaf certificates, certificate decoding, OpenSSL translation, and local CA vault storage.

## Features

- Generate X.509 certificates with configurable subject DN and validity periods
- Support for self-signed, root/intermediate CA, and CA-signed certificate flows
- SAN configuration for DNS, IP, and email entries
- X.509 v3 extension controls including:
  - Basic constraints
  - Key usage
  - Extended key usage
- Key size and digest selection
- Optional passphrase protection for private keys
- OpenSSL CLI generation and translation output
- PKCS#12 / DER export workflow support
- Local CA vault for saving and reusing trusted issuers
- Certificate decoding and inspection view
- Preset templates for localhost, wildcard, mTLS, and root CA scenarios

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Web crypto / browser-based certificate generation
- Node.js utilities for OpenSSL-compatible output and key handling

## Project Structure

```text
.
├── .aistudio/
├── .github/
├── src/
│   ├── components/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── bun.lock
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

This starts the app at:

- http://localhost:3000

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Available Scripts

```json
{
  "dev": "vite --port=3000 --host=0.0.0.0",
  "build": "vite build",
  "preview": "vite preview",
  "clean": "rm -rf dist server.js",
  "lint": "tsc --noEmit"
}
```

## Environment Variables

The project includes an example environment file:

```bash
cp .env.example .env
```

The following variables are referenced:

- `GEMINI_API_KEY`: required for Gemini AI API access
- `APP_URL`: application URL used for self-referential links and endpoints

## Usage

1. Open the app in the browser.
2. Choose a certificate generation mode:
   - Root / Intermediate CA
   - Self-Signed Leaf
   - CA-Signed Leaf
3. Fill in the subject details and certificate metadata.
4. Configure SANs, key usage, and extension settings as needed.
5. Click Generate X.509 Certificate.
6. Copy, export, or decode the generated certificate and key material.

## Notes

This project is designed to run primarily in the browser, so certificate generation happens client-side without requiring a backend service for the certificate creation workflow itself. The app is tailored for local developer PKI tasks, certificate experimentation, and OpenSSL training.

## License

This project does not currently declare a license in the repository metadata. If you plan to publish or distribute it publicly, consider adding an appropriate license file and license header.

## Contributing

Contributions are welcome. If you want to improve certificate validation, add new templates, or expand export formats, open an issue or submit a pull request.
