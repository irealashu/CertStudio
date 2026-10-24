import type {
  SubjectDN,
  KeySize,
  DigestAlgorithm,
  SANItem,
  KeyUsageOptions,
  ExtKeyUsageOptions,
  BasicConstraintsOptions,
  CertMode,
  GeneratedCertificateResult,
  DecodedCertificate,
} from '../utils/cryptoEngine.ts';

export type {
  SubjectDN,
  KeySize,
  DigestAlgorithm,
  SANItem,
  KeyUsageOptions,
  ExtKeyUsageOptions,
  BasicConstraintsOptions,
  CertMode,
  GeneratedCertificateResult,
  DecodedCertificate,
};

export interface SavedCA {
  id: string;
  name: string;
  createdAt: string;
  certPem: string;
  privateKeyPem: string;
  passphrase?: string;
  fingerprintSha256: string;
  notAfter: string;
  subjectDN: string;
}

export type ActiveTab = 'generator' | 'decoder';

export interface FormState {
  mode: CertMode;
  subject: SubjectDN;
  keySize: KeySize;
  digest: DigestAlgorithm;
  serialNumberHex: string;
  notBeforeDate: string; // YYYY-MM-DD
  notAfterDate: string;  // YYYY-MM-DD
  passphrase: string;
  sans: SANItem[];
  basicConstraints: BasicConstraintsOptions;
  keyUsage: KeyUsageOptions;
  extKeyUsage: ExtKeyUsageOptions;
  
  // CA-signed options
  issuerSource: 'vault' | 'custom';
  selectedVaultCaId: string;
  customIssuerCertPem: string;
  customIssuerKeyPem: string;
  customIssuerPassphrase: string;
}
