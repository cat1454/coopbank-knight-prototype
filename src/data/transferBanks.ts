export interface TransferBank {
  code: string;
  bin: string;
  displayName: string;
  listTitle: string;
  legalName: string;
  logoUrl: string;
}

// Source: VietQR bank list API, https://api.vietqr.io/v2/banks.
// Logo files in /public/bank-logos are downloaded from https://cdn.vietqr.io/img/{code}.png.
// These entries keep the provider code/BIN/logo URL together so the UI does not invent bank branding.
export const transferBanks: TransferBank[] = [
  {
    code: "TCB",
    bin: "970407",
    displayName: "Techcombank",
    listTitle: "Techcombank - TCB",
    legalName: "Ngân hàng TMCP Kỹ thương Việt Nam",
    logoUrl: "/bank-logos/TCB.png",
  },
  {
    code: "MB",
    bin: "970422",
    displayName: "MB",
    listTitle: "MB",
    legalName: "Ngân hàng TMCP Quân Đội",
    logoUrl: "/bank-logos/MB.png",
  },
  {
    code: "VCB",
    bin: "970436",
    displayName: "Vietcombank",
    listTitle: "Vietcombank",
    legalName: "Ngân hàng TMCP Ngoại thương Việt Nam",
    logoUrl: "/bank-logos/VCB.png",
  },
  {
    code: "ICB",
    bin: "970415",
    displayName: "VietinBank",
    listTitle: "VietinBank",
    legalName: "Ngân hàng TMCP Công thương Việt Nam",
    logoUrl: "/bank-logos/ICB.png",
  },
  {
    code: "BIDV",
    bin: "970418",
    displayName: "BIDV",
    listTitle: "BIDV",
    legalName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    logoUrl: "/bank-logos/BIDV.png",
  },
  {
    code: "ACB",
    bin: "970416",
    displayName: "ACB",
    listTitle: "ACB",
    legalName: "Ngân hàng TMCP Á Châu",
    logoUrl: "/bank-logos/ACB.png",
  },
  {
    code: "VPB",
    bin: "970432",
    displayName: "VPBank",
    listTitle: "VPBank",
    legalName: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    logoUrl: "/bank-logos/VPB.png",
  },
  {
    code: "COOPBANK",
    bin: "970446",
    displayName: "Co-opBank",
    listTitle: "Co-opBank",
    legalName: "Ngân hàng Hợp tác xã Việt Nam",
    logoUrl: "/bank-logos/COOPBANK.png",
  },
  {
    code: "VBA",
    bin: "970405",
    displayName: "Agribank",
    listTitle: "Agribank",
    legalName: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
    logoUrl: "/bank-logos/VBA.png",
  },
];

export const defaultTransferBank = transferBanks.find((bank) => bank.code === "COOPBANK") ?? transferBanks[0];
