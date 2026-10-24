import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRandomSerial,
  generateX509Certificate,
  decodeCertificate,
  generateOpenSSLConfig,
  generateOpenSSLCommands,
  type GenerateCertOptions
} from './cryptoEngine.ts';

test('generateRandomSerial returns a 32-character positive hex string', () => {
  const serial = generateRandomSerial();
  assert.equal(typeof serial, 'string');
  assert.equal(serial.length, 32);
  assert.match(serial, /^[0-9A-F]+$/);
});

test('generateOpenSSLConfig produces valid openssl.cnf sections', () => {
  const options: GenerateCertOptions = {
    mode: 'self_signed',
    subject: {
      commonName: 'localhost.test',
      organization: 'Dev Org',
      country: 'US',
    },
    keySize: 2048,
    digest: 'SHA-256',
    sans: [
      { id: '1', type: 'DNS', value: 'localhost.test' },
      { id: '2', type: 'IP', value: '127.0.0.1' },
    ],
    basicConstraints: { cA: false, critical: true },
    keyUsage: {
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: true,
      dataEncipherment: false,
      keyAgreement: false,
      keyCertSign: false,
      cRLSign: false,
      critical: true,
    },
    extKeyUsage: {
      serverAuth: true,
      clientAuth: true,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
      critical: false,
    },
  };

  const cnf = generateOpenSSLConfig(options);
  assert.match(cnf, /CN\s*=\s*localhost\.test/);
  assert.match(cnf, /DNS\.1\s*=\s*localhost\.test/);
  assert.match(cnf, /IP\.1\s*=\s*127\.0\.0\.1/);
  assert.match(cnf, /basicConstraints = critical, CA:FALSE/);
  assert.match(cnf, /extendedKeyUsage = serverAuth, clientAuth/);

  const cli = generateOpenSSLCommands(options);
  assert.match(cli, /openssl genrsa/);
  assert.match(cli, /openssl req -x509/);
});

test('generateX509Certificate and decodeCertificate end-to-end', async () => {
  const options: GenerateCertOptions = {
    mode: 'root_ca',
    subject: {
      commonName: 'Test Root CA',
      organization: 'Test Labs',
      country: 'US',
    },
    keySize: 2048,
    digest: 'SHA-256',
    sans: [],
    basicConstraints: { cA: true, critical: true, pathLenConstraint: 0 },
    keyUsage: {
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: false,
      dataEncipherment: false,
      keyAgreement: false,
      keyCertSign: true,
      cRLSign: true,
      critical: true,
    },
    extKeyUsage: {
      serverAuth: false,
      clientAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
      critical: false,
    },
  };

  const caResult = await generateX509Certificate(options);
  assert.ok(caResult.certPem.includes('-----BEGIN CERTIFICATE-----'));
  assert.ok(caResult.privateKeyPem.includes('-----BEGIN RSA PRIVATE KEY-----'));
  assert.ok(caResult.derCertBuffer.length > 0);
  assert.ok(caResult.pfxBuffer.length > 0);
  assert.match(caResult.fingerprintSha256, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);

  // Decode the generated Root CA
  const decodedCA = decodeCertificate(caResult.certPem);
  assert.equal(decodedCA.subject.commonName, 'Test Root CA');
  assert.equal(decodedCA.subject.organization, 'Test Labs');
  assert.equal(decodedCA.keySize, 2048);
  assert.equal(decodedCA.isActive, true);
  assert.equal(decodedCA.isExpired, false);

  // Now issue a CA-signed leaf cert
  const leafOptions: GenerateCertOptions = {
    mode: 'ca_signed',
    subject: {
      commonName: 'api.internal.local',
      organization: 'Test Labs',
    },
    keySize: 2048,
    digest: 'SHA-256',
    sans: [
      { id: '1', type: 'DNS', value: 'api.internal.local' },
      { id: '2', type: 'IP', value: '10.0.0.5' },
    ],
    basicConstraints: { cA: false, critical: true },
    keyUsage: {
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: true,
      dataEncipherment: false,
      keyAgreement: false,
      keyCertSign: false,
      cRLSign: false,
      critical: true,
    },
    extKeyUsage: {
      serverAuth: true,
      clientAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
      critical: false,
    },
    issuerCertPem: caResult.certPem,
    issuerPrivateKeyPem: caResult.privateKeyPem,
  };

  const leafResult = await generateX509Certificate(leafOptions);
  assert.ok(leafResult.certPem.includes('-----BEGIN CERTIFICATE-----'));
  assert.ok(leafResult.fullChainPem.includes(caResult.certPem));

  const decodedLeaf = decodeCertificate(leafResult.certPem);
  assert.equal(decodedLeaf.subject.commonName, 'api.internal.local');
  assert.ok(decodedLeaf.issuerString.includes('Test Root CA'));
  assert.equal(decodedLeaf.extensions.some(e => e.name === 'subjectAltName'), true);
});

test('generateX509Certificate with passphrase exports encrypted private key', async () => {
  const options: GenerateCertOptions = {
    mode: 'self_signed',
    subject: { commonName: 'secure.internal' },
    keySize: 2048,
    digest: 'SHA-256',
    passphrase: 'SecretPassword123!',
    sans: [{ id: '1', type: 'DNS', value: 'secure.internal' }],
    basicConstraints: { cA: false, critical: false },
    keyUsage: {
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: true,
      dataEncipherment: false,
      keyAgreement: false,
      keyCertSign: false,
      cRLSign: false,
      critical: false,
    },
    extKeyUsage: {
      serverAuth: true,
      clientAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
      critical: false,
    },
  };

  const result = await generateX509Certificate(options);
  assert.ok(result.encryptedPrivateKeyPem);
  assert.ok(result.encryptedPrivateKeyPem.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----'));
});

