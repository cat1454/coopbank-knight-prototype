export interface TransferBank {
  code: string;
  bin: string;
  displayName: string;
  legalName: string;
  logoUrl: string;
}

// Source: VietQR bank list API, https://api.vietqr.io/v2/banks.
// These entries keep the provider code/BIN/logo URL together so the UI does not invent bank branding.
export const transferBanks: TransferBank[] = [
  {
    code: "COOPBANK",
    bin: "970446",
    displayName: "Co-opBank",
    legalName: "Ngân hàng Hợp tác xã Việt Nam",
    logoUrl: "https://cdn.vietqr.io/img/COOPBANK.png",
  },
  {
    code: "VCB",
    bin: "970436",
    displayName: "Vietcombank",
    legalName: "Ngân hàng TMCP Ngoại Thương Việt Nam",
    logoUrl: "https://cdn.vietqr.io/img/VCB.png",
  },
  {
    code: "BIDV",
    bin: "970418",
    displayName: "BIDV",
    legalName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    logoUrl: "https://cdn.vietqr.io/img/BIDV.png",
  },
  {
    code: "VBA",
    bin: "970405",
    displayName: "Agribank",
    legalName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
    logoUrl: "https://cdn.vietqr.io/img/VBA.png",
  },
  {
    code: "ICB",
    bin: "970415",
    displayName: "VietinBank",
    legalName: "Ngân hàng TMCP Công thương Việt Nam",
    logoUrl: "https://cdn.vietqr.io/img/ICB.png",
  },
  {
    code: "MB",
    bin: "970422",
    displayName: "MBBank",
    legalName: "Ngân hàng TMCP Quân đội",
    logoUrl: "https://cdn.vietqr.io/img/MB.png",
  },
  {
    code: "TCB",
    bin: "970407",
    displayName: "Techcombank",
    legalName: "Ngân hàng TMCP Kỹ thương Việt Nam",
    logoUrl: "https://cdn.vietqr.io/img/TCB.png",
  },
  {
    code: "ACB",
    bin: "970416",
    displayName: "ACB",
    legalName: "Ngân hàng TMCP Á Châu",
    logoUrl: "https://cdn.vietqr.io/img/ACB.png",
  },
  {
    code: "VPB",
    bin: "970432",
    displayName: "VPBank",
    legalName: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    logoUrl: "https://cdn.vietqr.io/img/VPB.png",
  },
];

export const defaultTransferBank = transferBanks[0];
