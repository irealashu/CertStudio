import forge from 'node-forge';

export interface SubjectDN {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  country?: string; // 2 letters
  state?: string;
  locality?: string;
  emailAddress?: string;
}

export type KeySize = 2048 | 4096;
export type DigestAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

export interface SANItem {
  id: string;
  type: 'DNS' | 'IP' | 'URI' | 'Email';
  value: string;
}

export interface KeyUsageOptions {
  digitalSignature: boolean;
  nonRepudiation: boolean;
  keyEncipherment: boolean;
  dataEncipherment: boolean;
  keyAgreement: boolean;
  keyCertSign: boolean;
  cRLSign: boolean;
  critical: boolean;
}

export interface ExtKeyUsageOptions {
  serverAuth: boolean;
  clientAuth: boolean;
  codeSigning: boolean;
  emailProtection: boolean;
  timeStamping: boolean;
  critical: boolean;
}

export interface BasicConstraintsOptions {
  cA: boolean;
  critical: boolean;
  pathLenConstraint?: number | null;
}

export type CertMode = 'root_ca' | 'self_signed' | 'ca_signed';

export interface GenerateCertOptions {
  mode: CertMode;
  subject: SubjectDN;
  keySize: KeySize;
  digest: DigestAlgorithm;
  serialNumberHex?: string;
  notBefore?: Date;
  notAfter?: Date;
  passphrase?: string;
  sans: SANItem[];
  basicConstraints: BasicConstraintsOptions;
  keyUsage: KeyUsageOptions;
  extKeyUsage: ExtKeyUsageOptions;
  // For ca_signed mode:
  issuerCertPem?: string;
  issuerPrivateKeyPem?: string;
  issuerPassphrase?: string;
}

export interface GeneratedCertificateResult {
  certPem: string;
  privateKeyPem: string;
  encryptedPrivateKeyPem?: string;
  fullChainPem: string;
  crtPem: string;
  derCertBuffer: Uint8Array;
  pfxBuffer: Uint8Array;
  serialNumberHex: string;
  fingerprintSha256: string;
  fingerprintSha1: string;
  subjectDN: string;
  issuerDN: string;
  notBefore: Date;
  notAfter: Date;
  keySize: number;
  digest: string;
}

export interface DecodedExtension {
  name: string;
  critical?: boolean;
  valueDescription: string;
}

export interface DecodedCertificate {
  subject: SubjectDN;
  subjectString: string;
  issuerString: string;
  serialNumberHex: string;
  notBefore: Date;
  notAfter: Date;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  keySize: number;
  signatureAlgorithm: string;
  fingerprintSha256: string;
  fingerprintSha1: string;
  extensions: DecodedExtension[];
  rawPem: string;
}

/**
 * Standardize newline formatting to standard \n
 */
export function normalizePem(pem: string): string {
  return pem.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';
}

/**
 * Generate a random 128-bit positive hex serial number
 */
export function generateRandomSerial(): string {
  const bytes = forge.random.getBytesSync(16);
  let hex = forge.util.bytesToHex(bytes);
  const firstByte = parseInt(hex.substring(0, 2), 16);
  if (firstByte > 0x7f) {
    hex = '0' + hex.substring(1);
  }
  return hex.toUpperCase();
}

/**
 * Helper to get MD instance from digest string
 */
function getMessageDigest(digest: DigestAlgorithm): forge.md.MessageDigest {
  switch (digest) {
    case 'SHA-384':
      return forge.md.sha384.create();
    case 'SHA-512':
      return forge.md.sha512.create();
    case 'SHA-256':
    default:
      return forge.md.sha256.create();
  }
}

/**
 * Build DN attribute array for forge
 */
function buildSubjectAttributes(dn: SubjectDN) {
  const attrs = [];
  if (dn.commonName) {
    attrs.push({ name: 'commonName', value: dn.commonName });
  }
  if (dn.organization) {
    attrs.push({ name: 'organizationName', value: dn.organization });
  }
  if (dn.organizationalUnit) {
    attrs.push({ name: 'organizationalUnitName', value: dn.organizationalUnit });
  }
  if (dn.country) {
    attrs.push({ name: 'countryName', value: dn.country.toUpperCase() });
  }
  if (dn.state) {
    attrs.push({ name: 'stateOrProvinceName', value: dn.state });
  }
  if (dn.locality) {
    attrs.push({ name: 'localityName', value: dn.locality });
  }
  if (dn.emailAddress) {
    attrs.push({ name: 'emailAddress', value: dn.emailAddress });
  }
  return attrs;
}

/**
 * Format DN attributes to readable string (e.g. CN=..., O=...)
 */
export function formatDN(attrs: { name?: string; shortName?: string; value?: unknown }[]): string {
  const map: Record<string, string> = {
    commonName: 'CN',
    organizationName: 'O',
    organizationalUnitName: 'OU',
    countryName: 'C',
    stateOrProvinceName: 'ST',
    localityName: 'L',
    emailAddress: 'emailAddress',
  };

  return attrs
    .map(a => {
      const key = a.shortName || (a.name && map[a.name]) || a.name || 'UNKNOWN';
      return `${key}=${String(a.value)}`;
    })
    .join(', ');
}

/**
 * Asynchronous RSA Key Pair generation
 */
export async function generateRsaKeyPair(
  bits: KeySize,
  onProgress?: (status: string) => void
): Promise<{ privateKey: forge.pki.rsa.PrivateKey; publicKey: forge.pki.rsa.PublicKey }> {
  if (onProgress) {
    onProgress(`Generating ${bits}-bit RSA keypair...`);
  }

  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair(
      { bits, workers: -1 },
      (err, keypair) => {
        if (err) {
          reject(err);
        } else {
          resolve(keypair);
        }
      }
    );
  });
}

/**
 * Generate X.509 Certificate
 */
export async function generateX509Certificate(
  options: GenerateCertOptions,
  onProgress?: (status: string) => void
): Promise<GeneratedCertificateResult> {
  const {
    mode,
    subject,
    keySize,
    digest,
    serialNumberHex = generateRandomSerial(),
    notBefore = new Date(),
    notAfter = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    passphrase,
    sans,
    basicConstraints,
    keyUsage,
    extKeyUsage,
    issuerCertPem,
    issuerPrivateKeyPem,
    issuerPassphrase,
  } = options;

  if (!subject.commonName?.trim()) {
    throw new Error('Common Name (CN) is required.');
  }

  // 1. Generate Key Pair
  onProgress?.(`Generating ${keySize}-bit RSA keypair...`);
  const keypair = await generateRsaKeyPair(keySize, onProgress);

  // 2. Prepare Certificate object
  onProgress?.('Configuring X.509 extensions and subject attributes...');
  const cert = forge.pki.createCertificate();
  cert.publicKey = keypair.publicKey;
  cert.serialNumber = serialNumberHex.toLowerCase();
  cert.validity.notBefore = notBefore;
  cert.validity.notAfter = notAfter;

  const subjectAttrs = buildSubjectAttributes(subject);
  cert.setSubject(subjectAttrs);

  // 3. Resolve Issuer & Signing Key
  let signingKey: forge.pki.rsa.PrivateKey = keypair.privateKey;
  let issuerCert: forge.pki.Certificate | null = null;

  if (mode === 'ca_signed') {
    if (!issuerCertPem || !issuerPrivateKeyPem) {
      throw new Error('Issuer Certificate and Private Key are required for CA-signed mode.');
    }
    try {
      issuerCert = forge.pki.certificateFromPem(issuerCertPem);
      cert.setIssuer(issuerCert.subject.attributes);
    } catch {
      throw new Error('Failed to parse Issuer Certificate PEM.');
    }

    try {
      if (issuerPassphrase && issuerPassphrase.trim() !== '') {
        signingKey = forge.pki.decryptRsaPrivateKey(issuerPrivateKeyPem, issuerPassphrase);
      } else {
        signingKey = forge.pki.privateKeyFromPem(issuerPrivateKeyPem);
      }
      if (!signingKey) {
        throw new Error('Could not decrypt/read Issuer Private Key. Check passphrase if encrypted.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid private key or passphrase';
      throw new Error(`Failed to read Issuer Private Key: ${msg}`);
    }
  } else {
    // Root CA or Self-Signed Leaf
    cert.setIssuer(subjectAttrs);
    signingKey = keypair.privateKey;
  }

  // 4. Construct X.509 Extensions
  const extensions: Array<Record<string, unknown>> = [];

  // Basic Constraints
  const bcExt: Record<string, unknown> = {
    name: 'basicConstraints',
    cA: basicConstraints.cA,
    critical: basicConstraints.critical,
  };
  if (basicConstraints.cA && typeof basicConstraints.pathLenConstraint === 'number') {
    bcExt.pathLenConstraint = basicConstraints.pathLenConstraint;
  }
  extensions.push(bcExt);

  // Key Usage
  const hasKeyUsage =
    keyUsage.digitalSignature ||
    keyUsage.nonRepudiation ||
    keyUsage.keyEncipherment ||
    keyUsage.dataEncipherment ||
    keyUsage.keyAgreement ||
    keyUsage.keyCertSign ||
    keyUsage.cRLSign;

  if (hasKeyUsage) {
    extensions.push({
      name: 'keyUsage',
      critical: keyUsage.critical,
      digitalSignature: keyUsage.digitalSignature,
      nonRepudiation: keyUsage.nonRepudiation,
      keyEncipherment: keyUsage.keyEncipherment,
      dataEncipherment: keyUsage.dataEncipherment,
      keyAgreement: keyUsage.keyAgreement,
      keyCertSign: keyUsage.keyCertSign,
      cRLSign: keyUsage.cRLSign,
    });
  }

  // Extended Key Usage
  const hasExtKeyUsage =
    extKeyUsage.serverAuth ||
    extKeyUsage.clientAuth ||
    extKeyUsage.codeSigning ||
    extKeyUsage.emailProtection ||
    extKeyUsage.timeStamping;

  if (hasExtKeyUsage) {
    extensions.push({
      name: 'extKeyUsage',
      critical: extKeyUsage.critical,
      serverAuth: extKeyUsage.serverAuth,
      clientAuth: extKeyUsage.clientAuth,
      codeSigning: extKeyUsage.codeSigning,
      emailProtection: extKeyUsage.emailProtection,
      timeStamping: extKeyUsage.timeStamping,
    });
  }

  // Subject Alternative Names (SANs)
  const validSANs = sans.filter(s => s.value && s.value.trim().length > 0);
  if (validSANs.length > 0) {
    const altNames = validSANs.map(s => {
      const trimmed = s.value.trim();
      switch (s.type) {
        case 'IP':
          return { type: 7, ip: trimmed };
        case 'URI':
          return { type: 6, value: trimmed };
        case 'Email':
          return { type: 1, value: trimmed };
        case 'DNS':
        default:
          return { type: 2, value: trimmed };
      }
    });
    extensions.push({
      name: 'subjectAltName',
      altNames,
    });
  }

  // Subject Key Identifier (standard RFC 5280)
  extensions.push({
    name: 'subjectKeyIdentifier',
  });

  // Authority Key Identifier (for CA-signed or Root CA)
  if (mode === 'ca_signed' && issuerCert) {
    extensions.push({
      name: 'authorityKeyIdentifier',
      keyIdentifier: true,
      authorityCertIssuer: true,
      serialNumber: true,
    });
  } else if (mode === 'root_ca') {
    extensions.push({
      name: 'authorityKeyIdentifier',
      keyIdentifier: true,
    });
  }

  cert.setExtensions(extensions);

  // 5. Sign the certificate
  onProgress?.(`Signing certificate with ${digest}...`);
  const md = getMessageDigest(digest);
  cert.sign(signingKey, md);

  // 6. Exports & Formats
  onProgress?.('Generating binary and text export packages...');
  const certPem = normalizePem(forge.pki.certificateToPem(cert));
  const privateKeyPem = normalizePem(forge.pki.privateKeyToPem(keypair.privateKey));

  let encryptedPrivateKeyPem: string | undefined = undefined;
  if (passphrase && passphrase.trim() !== '') {
    encryptedPrivateKeyPem = normalizePem(
      forge.pki.encryptRsaPrivateKey(keypair.privateKey, passphrase, {
        algorithm: 'aes256',
      })
    );
  }

  // True binary ASN.1 DER Certificate
  const asn1Cert = forge.pki.certificateToAsn1(cert);
  const derBytes = forge.asn1.toDer(asn1Cert).getBytes();
  const derCertBuffer = new Uint8Array(derBytes.length);
  for (let i = 0; i < derBytes.length; i++) {
    derCertBuffer[i] = derBytes.charCodeAt(i);
  }

  // True binary PKCS#12 (.pfx / .p12)
  const certChain = [cert];
  if (issuerCert) {
    certChain.push(issuerCert);
  }

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keypair.privateKey,
    certChain,
    passphrase || '',
    {
      algorithm: 'aes256',
      generateLocalKeyId: true,
      friendlyName: subject.commonName,
    }
  );
  const p12Bytes = forge.asn1.toDer(p12Asn1).getBytes();
  const pfxBuffer = new Uint8Array(p12Bytes.length);
  for (let i = 0; i < p12Bytes.length; i++) {
    pfxBuffer[i] = p12Bytes.charCodeAt(i);
  }

  // Full chain PEM
  let fullChainPem = certPem;
  if (issuerCertPem) {
    fullChainPem = certPem + normalizePem(issuerCertPem);
  }
  fullChainPem += privateKeyPem;

  // Fingerprints
  const sha256Md = forge.md.sha256.create();
  sha256Md.update(derBytes);
  const fingerprintSha256 = (sha256Md.digest().toHex().match(/.{2}/g) || []).join(':').toUpperCase();

  const sha1Md = forge.md.sha1.create();
  sha1Md.update(derBytes);
  const fingerprintSha1 = (sha1Md.digest().toHex().match(/.{2}/g) || []).join(':').toUpperCase();

  return {
    certPem,
    privateKeyPem,
    encryptedPrivateKeyPem,
    fullChainPem,
    crtPem: certPem,
    derCertBuffer,
    pfxBuffer,
    serialNumberHex,
    fingerprintSha256,
    fingerprintSha1,
    subjectDN: formatDN(cert.subject.attributes),
    issuerDN: formatDN(cert.issuer.attributes),
    notBefore,
    notAfter,
    keySize,
    digest,
  };
}

/**
 * Decode and parse any PEM or Base64 / DER Certificate
 */
export function decodeCertificate(input: string | Uint8Array): DecodedCertificate {
  let cert: forge.pki.Certificate;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.includes('-----BEGIN CERTIFICATE-----')) {
      cert = forge.pki.certificateFromPem(trimmed);
    } else {
      try {
        cert = forge.pki.certificateFromPem(`-----BEGIN CERTIFICATE-----\n${trimmed}\n-----END CERTIFICATE-----`);
      } catch {
        const binaryString = forge.util.decode64(trimmed);
        const asn1 = forge.asn1.fromDer(binaryString);
        cert = forge.pki.certificateFromAsn1(asn1);
      }
    }
  } else {
    let binary = '';
    for (let i = 0; i < input.length; i++) {
      binary += String.fromCharCode(input[i]);
    }
    const asn1 = forge.asn1.fromDer(binary);
    cert = forge.pki.certificateFromAsn1(asn1);
  }

  const subjectAttrs = cert.subject.attributes;
  const getAttr = (name: string) => {
    const found = subjectAttrs.find(a => a.name === name || a.shortName === name);
    return found ? String(found.value) : undefined;
  };

  const subject: SubjectDN = {
    commonName: getAttr('commonName') || 'Unknown',
    organization: getAttr('organizationName'),
    organizationalUnit: getAttr('organizationalUnitName'),
    country: getAttr('countryName'),
    state: getAttr('stateOrProvinceName'),
    locality: getAttr('localityName'),
    emailAddress: getAttr('emailAddress'),
  };

  const now = new Date();
  const notBefore = cert.validity.notBefore;
  const notAfter = cert.validity.notAfter;
  const isActive = now >= notBefore && now <= notAfter;
  const isExpired = now > notAfter;
  const daysRemaining = Math.max(0, Math.ceil((notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const rsaKey = cert.publicKey as forge.pki.rsa.PublicKey;
  const keySize = rsaKey.n ? rsaKey.n.bitLength() : 2048;

  const asn1Cert = forge.pki.certificateToAsn1(cert);
  const derBytes = forge.asn1.toDer(asn1Cert).getBytes();

  const sha256Md = forge.md.sha256.create();
  sha256Md.update(derBytes);
  const fingerprintSha256 = (sha256Md.digest().toHex().match(/.{2}/g) || []).join(':').toUpperCase();

  const sha1Md = forge.md.sha1.create();
  sha1Md.update(derBytes);
  const fingerprintSha1 = (sha1Md.digest().toHex().match(/.{2}/g) || []).join(':').toUpperCase();

  const signatureOid = cert.signatureOid;
  const signatureAlgorithm = forge.pki.oids[signatureOid] || signatureOid || 'sha256WithRSAEncryption';

  const decodedExtensions: DecodedExtension[] = [];
  if (cert.extensions) {
    for (const ext of cert.extensions) {
      let desc = '';
      if (ext.name === 'basicConstraints') {
        desc = `CA: ${ext.cA ? 'TRUE' : 'FALSE'}${ext.pathLenConstraint !== undefined ? `, pathLen: ${ext.pathLenConstraint}` : ''}`;
      } else if (ext.name === 'keyUsage') {
        const usages: string[] = [];
        if (ext.digitalSignature) usages.push('digitalSignature');
        if (ext.nonRepudiation) usages.push('nonRepudiation');
        if (ext.keyEncipherment) usages.push('keyEncipherment');
        if (ext.dataEncipherment) usages.push('dataEncipherment');
        if (ext.keyAgreement) usages.push('keyAgreement');
        if (ext.keyCertSign) usages.push('keyCertSign');
        if (ext.cRLSign) usages.push('cRLSign');
        desc = usages.join(', ') || 'None';
      } else if (ext.name === 'extKeyUsage') {
        const ekus: string[] = [];
        if (ext.serverAuth) ekus.push('TLS Web Server (serverAuth)');
        if (ext.clientAuth) ekus.push('TLS Web Client (clientAuth)');
        if (ext.codeSigning) ekus.push('Code Signing (codeSigning)');
        if (ext.emailProtection) ekus.push('Email Protection (emailProtection)');
        if (ext.timeStamping) ekus.push('Timestamping (timeStamping)');
        desc = ekus.join(', ') || 'None';
      } else if (ext.name === 'subjectAltName') {
        if (Array.isArray(ext.altNames)) {
          desc = ext.altNames
            .map((a: { type: number; value?: string; ip?: string }) => {
              if (a.type === 2) return `DNS:${a.value}`;
              if (a.type === 7) return `IP:${a.ip}`;
              if (a.type === 6) return `URI:${a.value}`;
              if (a.type === 1) return `Email:${a.value}`;
              return `Type${a.type}:${a.value || a.ip}`;
            })
            .join(', ');
        }
      } else {
        desc = ext.value ? 'Configured' : 'Present';
      }

      decodedExtensions.push({
        name: ext.name || ext.id || 'Custom Extension',
        critical: !!ext.critical,
        valueDescription: desc || 'Present',
      });
    }
  }

  return {
    subject,
    subjectString: formatDN(cert.subject.attributes),
    issuerString: formatDN(cert.issuer.attributes),
    serialNumberHex: cert.serialNumber.toUpperCase(),
    notBefore,
    notAfter,
    isActive,
    isExpired,
    daysRemaining,
    keySize,
    signatureAlgorithm,
    fingerprintSha256,
    fingerprintSha1,
    extensions: decodedExtensions,
    rawPem: normalizePem(forge.pki.certificateToPem(cert)),
  };
}

/**
 * Generate OpenSSL Configuration File (`openssl.cnf`)
 */
export function generateOpenSSLConfig(options: GenerateCertOptions): string {
  const { subject, sans, basicConstraints, keyUsage, extKeyUsage, mode } = options;

  const validSANs = sans.filter(s => s.value && s.value.trim().length > 0);

  const lines: string[] = [
    '# OpenSSL Configuration generated by CertStudio',
    '# Compliant with RFC 5280, PKCS#8 and modern TLS practices',
    '',
    '[ req ]',
    'default_bits        = ' + options.keySize,
    'default_md          = ' + options.digest.toLowerCase().replace('-', ''),
    'distinguished_name  = req_distinguished_name',
    'string_mask         = utf8only',
    'prompt              = no',
  ];

  if (mode === 'root_ca') {
    lines.push('x509_extensions     = v3_ca');
  } else {
    lines.push('req_extensions      = v3_req');
    lines.push('x509_extensions     = v3_req');
  }

  lines.push('');
  lines.push('[ req_distinguished_name ]');
  if (subject.country) lines.push(`C                   = ${subject.country.toUpperCase()}`);
  if (subject.state) lines.push(`ST                  = ${subject.state}`);
  if (subject.locality) lines.push(`L                   = ${subject.locality}`);
  if (subject.organization) lines.push(`O                   = ${subject.organization}`);
  if (subject.organizationalUnit) lines.push(`OU                  = ${subject.organizationalUnit}`);
  lines.push(`CN                  = ${subject.commonName || 'localhost'}`);
  if (subject.emailAddress) lines.push(`emailAddress        = ${subject.emailAddress}`);

  lines.push('');
  lines.push('[ v3_req ]');
  lines.push('subjectKeyIdentifier = hash');
  if (mode === 'ca_signed') {
    lines.push('authorityKeyIdentifier = keyid:always,issuer');
  }

  let bcStr = `basicConstraints = ${basicConstraints.critical ? 'critical, ' : ''}CA:${basicConstraints.cA ? 'TRUE' : 'FALSE'}`;
  if (basicConstraints.cA && typeof basicConstraints.pathLenConstraint === 'number') {
    bcStr += `, pathlen:${basicConstraints.pathLenConstraint}`;
  }
  lines.push(bcStr);

  const kuList: string[] = [];
  if (keyUsage.digitalSignature) kuList.push('digitalSignature');
  if (keyUsage.nonRepudiation) kuList.push('nonRepudiation');
  if (keyUsage.keyEncipherment) kuList.push('keyEncipherment');
  if (keyUsage.dataEncipherment) kuList.push('dataEncipherment');
  if (keyUsage.keyAgreement) kuList.push('keyAgreement');
  if (keyUsage.keyCertSign) kuList.push('keyCertSign');
  if (keyUsage.cRLSign) kuList.push('cRLSign');
  if (kuList.length > 0) {
    lines.push(`keyUsage = ${keyUsage.critical ? 'critical, ' : ''}${kuList.join(', ')}`);
  }

  const ekuList: string[] = [];
  if (extKeyUsage.serverAuth) ekuList.push('serverAuth');
  if (extKeyUsage.clientAuth) ekuList.push('clientAuth');
  if (extKeyUsage.codeSigning) ekuList.push('codeSigning');
  if (extKeyUsage.emailProtection) ekuList.push('emailProtection');
  if (extKeyUsage.timeStamping) ekuList.push('timeStamping');
  if (ekuList.length > 0) {
    lines.push(`extendedKeyUsage = ${extKeyUsage.critical ? 'critical, ' : ''}${ekuList.join(', ')}`);
  }

  if (validSANs.length > 0) {
    lines.push('subjectAltName = @alt_names');
  }

  lines.push('');
  lines.push('[ v3_ca ]');
  lines.push('subjectKeyIdentifier = hash');
  lines.push('authorityKeyIdentifier = keyid:always,issuer');
  lines.push('basicConstraints = critical, CA:TRUE');
  lines.push('keyUsage = critical, digitalSignature, cRLSign, keyCertSign');

  if (validSANs.length > 0) {
    lines.push('');
    lines.push('[ alt_names ]');
    let dnsIdx = 1;
    let ipIdx = 1;
    let uriIdx = 1;
    let emailIdx = 1;
    for (const s of validSANs) {
      const val = s.value.trim();
      if (s.type === 'DNS') {
        lines.push(`DNS.${dnsIdx++} = ${val}`);
      } else if (s.type === 'IP') {
        lines.push(`IP.${ipIdx++} = ${val}`);
      } else if (s.type === 'URI') {
        lines.push(`URI.${uriIdx++} = ${val}`);
      } else if (s.type === 'Email') {
        lines.push(`email.${emailIdx++} = ${val}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Generate OpenSSL CLI snippets
 */
export function generateOpenSSLCommands(options: GenerateCertOptions): string {
  const { mode, keySize, digest, passphrase, subject, notBefore = new Date(), notAfter = new Date(Date.now() + 365 * 86400000) } = options;
  const days = Math.max(1, Math.round((notAfter.getTime() - notBefore.getTime()) / (1000 * 60 * 60 * 24)));
  const mdFlag = '-' + digest.toLowerCase().replace('-', '');
  const baseName = (subject.commonName || 'cert').toLowerCase().replace(/[^a-z0-9]/gi, '_');

  const encKeyOpt = passphrase ? `-aes256 -passout pass:"${passphrase}"` : '-nodes';

  let script = '#!/usr/bin/env bash\n# OpenSSL CLI Execution Guide for this Certificate\nset -euo pipefail\n\n';

  if (mode === 'root_ca') {
    script += `# 1. Generate Private Key for Root CA\n`;
    script += `openssl genrsa ${encKeyOpt} -out ${baseName}_ca.key ${keySize}\n\n`;

    script += `# 2. Generate Self-Signed Root CA Certificate\n`;
    script += `openssl req -x509 -new ${mdFlag} -key ${baseName}_ca.key -out ${baseName}_ca.crt \\\n`;
    script += `  -days ${days} -config openssl.cnf -extensions v3_ca\n\n`;

    script += `# 3. Verify Generated Root CA Certificate\n`;
    script += `openssl x509 -in ${baseName}_ca.crt -text -noout\n`;
  } else if (mode === 'self_signed') {
    script += `# 1. Generate Private Key\n`;
    script += `openssl genrsa ${encKeyOpt} -out ${baseName}.key ${keySize}\n\n`;

    script += `# 2. Generate Self-Signed Certificate with SAN Extensions\n`;
    script += `openssl req -x509 -new ${mdFlag} -key ${baseName}.key -out ${baseName}.crt \\\n`;
    script += `  -days ${days} -config openssl.cnf -extensions v3_req\n\n`;

    script += `# 3. (Optional) Export to PKCS#12 (.pfx) bundle\n`;
    script += `openssl pkcs12 -export -out ${baseName}.pfx -inkey ${baseName}.key -in ${baseName}.crt \\\n`;
    script += `  -name "${subject.commonName}" ${passphrase ? `-passout pass:"${passphrase}"` : '-nodes'}\n`;
  } else {
    // CA-signed
    script += `# 1. Generate Private Key for Leaf Certificate\n`;
    script += `openssl genrsa ${encKeyOpt} -out ${baseName}.key ${keySize}\n\n`;

    script += `# 2. Create Certificate Signing Request (CSR)\n`;
    script += `openssl req -new -key ${baseName}.key -out ${baseName}.csr -config openssl.cnf\n\n`;

    script += `# 3. Sign CSR with CA Key and Certificate\n`;
    script += `openssl x509 -req -in ${baseName}.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial \\\n`;
    script += `  -out ${baseName}.crt -days ${days} ${mdFlag} -extfile openssl.cnf -extensions v3_req\n\n`;

    script += `# 4. Create Full Chain Bundle & PKCS#12 (.pfx)\n`;
    script += `cat ${baseName}.crt rootCA.crt > ${baseName}_chain.crt\n`;
    script += `openssl pkcs12 -export -out ${baseName}.pfx -inkey ${baseName}.key -in ${baseName}.crt \\\n`;
    script += `  -certfile rootCA.crt -name "${subject.commonName}" ${passphrase ? `-passout pass:"${passphrase}"` : '-nodes'}\n`;
  }

  return script;
}
