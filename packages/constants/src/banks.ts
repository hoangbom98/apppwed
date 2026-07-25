/**
 * @lkvip/constants — banks.ts
 * Vietnamese bank list — single source of truth for the entire platform.
 *
 * Data source: VietQR API (https://api.vietqr.io/v2/banks)
 * Last synced: 2025-07
 */

export interface VNBank {
  id:                number;
  code:              string;
  bin:               string;
  name:              string;
  shortName:         string;
  logo:              string;
  transferSupported: 0 | 1;
  lookupSupported:   0 | 1;
}

export const VN_BANKS: VNBank[] = [
  { id: 17, code: 'ICB',       bin: '970415', name: 'Ngân hàng TMCP Công thương Việt Nam',                             shortName: 'VietinBank',        logo: 'https://cdn.vietqr.io/img/ICB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 43, code: 'VCB',       bin: '970436', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',                            shortName: 'Vietcombank',       logo: 'https://cdn.vietqr.io/img/VCB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 4,  code: 'BIDV',      bin: '970418', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',                   shortName: 'BIDV',              logo: 'https://cdn.vietqr.io/img/BIDV.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 42, code: 'VBA',       bin: '970405', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',         shortName: 'Agribank',          logo: 'https://cdn.vietqr.io/img/VBA.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 26, code: 'OCB',       bin: '970448', name: 'Ngân hàng TMCP Phương Đông',                                     shortName: 'OCB',               logo: 'https://cdn.vietqr.io/img/OCB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 21, code: 'MB',        bin: '970422', name: 'Ngân hàng TMCP Quân đội',                                        shortName: 'MBBank',            logo: 'https://cdn.vietqr.io/img/MB.png',           transferSupported: 1, lookupSupported: 1 },
  { id: 38, code: 'TCB',       bin: '970407', name: 'Ngân hàng TMCP Kỹ thương Việt Nam',                              shortName: 'Techcombank',       logo: 'https://cdn.vietqr.io/img/TCB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 2,  code: 'ACB',       bin: '970416', name: 'Ngân hàng TMCP Á Châu',                                          shortName: 'ACB',               logo: 'https://cdn.vietqr.io/img/ACB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 47, code: 'VPB',       bin: '970432', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',                            shortName: 'VPBank',            logo: 'https://cdn.vietqr.io/img/VPB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 39, code: 'TPB',       bin: '970423', name: 'Ngân hàng TMCP Tiên Phong',                                      shortName: 'TPBank',            logo: 'https://cdn.vietqr.io/img/TPB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 36, code: 'STB',       bin: '970403', name: 'Ngân hàng TMCP Sài Gòn Thương Tín',                              shortName: 'Sacombank',         logo: 'https://cdn.vietqr.io/img/STB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 12, code: 'HDB',       bin: '970437', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',               shortName: 'HDBank',            logo: 'https://cdn.vietqr.io/img/HDB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 44, code: 'VCCB',      bin: '970454', name: 'Ngân hàng TMCP Bản Việt',                                        shortName: 'VietCapitalBank',   logo: 'https://cdn.vietqr.io/img/VCCB.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 31, code: 'SCB',       bin: '970429', name: 'Ngân hàng TMCP Sài Gòn',                                         shortName: 'SCB',               logo: 'https://cdn.vietqr.io/img/SCB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 45, code: 'VIB',       bin: '970441', name: 'Ngân hàng TMCP Quốc tế Việt Nam',                               shortName: 'VIB',               logo: 'https://cdn.vietqr.io/img/VIB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 35, code: 'SHB',       bin: '970443', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',                               shortName: 'SHB',               logo: 'https://cdn.vietqr.io/img/SHB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 10, code: 'EIB',       bin: '970431', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',                        shortName: 'Eximbank',          logo: 'https://cdn.vietqr.io/img/EIB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 22, code: 'MSB',       bin: '970426', name: 'Ngân hàng TMCP Hàng Hải Việt Nam',                              shortName: 'MSB',               logo: 'https://cdn.vietqr.io/img/MSB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 53, code: 'CAKE',      bin: '546034', name: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank',       shortName: 'CAKE',              logo: 'https://cdn.vietqr.io/img/CAKE.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 54, code: 'Ubank',     bin: '546035', name: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank',      shortName: 'Ubank',             logo: 'https://cdn.vietqr.io/img/UBANK.png',        transferSupported: 1, lookupSupported: 1 },
  { id: 57, code: 'VTLMONEY',  bin: '971005', name: 'Tổng Công ty Dịch vụ số Viettel',                               shortName: 'ViettelMoney',      logo: 'https://cdn.vietqr.io/img/VIETTELMONEY.png', transferSupported: 0, lookupSupported: 1 },
  { id: 58, code: 'TIMO',      bin: '963388', name: 'Ngân hàng số Timo by Ban Viet Bank',                             shortName: 'Timo',              logo: 'https://vietqr.net/portal-service/resources/icons/TIMO.png', transferSupported: 1, lookupSupported: 0 },
  { id: 56, code: 'VNPTMONEY', bin: '971011', name: 'VNPT Money',                                                    shortName: 'VNPTMoney',         logo: 'https://cdn.vietqr.io/img/VNPTMONEY.png',    transferSupported: 0, lookupSupported: 1 },
  { id: 34, code: 'SGICB',     bin: '970400', name: 'Ngân hàng TMCP Sài Gòn Công Thương',                            shortName: 'SaigonBank',        logo: 'https://cdn.vietqr.io/img/SGICB.png',        transferSupported: 1, lookupSupported: 1 },
  { id: 3,  code: 'BAB',       bin: '970409', name: 'Ngân hàng TMCP Bắc Á',                                          shortName: 'BacABank',          logo: 'https://cdn.vietqr.io/img/BAB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 65, code: 'momo',      bin: '971025', name: 'CTCP Dịch Vụ Di Động Trực Tuyến',                               shortName: 'MoMo',              logo: 'https://cdn.vietqr.io/img/momo.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 64, code: 'PVDB',      bin: '971133', name: 'Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số',                shortName: 'PVcomBank Pay',     logo: 'https://cdn.vietqr.io/img/PVCB.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 30, code: 'PVCB',      bin: '970412', name: 'Ngân hàng TMCP Đại Chúng Việt Nam',                             shortName: 'PVcomBank',         logo: 'https://cdn.vietqr.io/img/PVCB.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 27, code: 'MBV',       bin: '970414', name: 'Ngân hàng TNHH MTV Việt Nam Hiện Đại',                          shortName: 'MBV',               logo: 'https://cdn.vietqr.io/img/MBV.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 24, code: 'NCB',       bin: '970419', name: 'Ngân hàng TMCP Quốc Dân',                                       shortName: 'NCB',               logo: 'https://cdn.vietqr.io/img/NCB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 37, code: 'SHBVN',     bin: '970424', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam',                           shortName: 'ShinhanBank',       logo: 'https://cdn.vietqr.io/img/SHBVN.png',        transferSupported: 1, lookupSupported: 1 },
  { id: 1,  code: 'ABB',       bin: '970425', name: 'Ngân hàng TMCP An Bình',                                        shortName: 'ABBANK',            logo: 'https://cdn.vietqr.io/img/ABB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 41, code: 'VAB',       bin: '970427', name: 'Ngân hàng TMCP Việt Á',                                         shortName: 'VietABank',         logo: 'https://cdn.vietqr.io/img/VAB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 23, code: 'NAB',       bin: '970428', name: 'Ngân hàng TMCP Nam Á',                                          shortName: 'NamABank',          logo: 'https://cdn.vietqr.io/img/NAB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 29, code: 'PGB',       bin: '970430', name: 'Ngân hàng TMCP Thịnh vượng và Phát triển',                      shortName: 'PGBank',            logo: 'https://cdn.vietqr.io/img/PGB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 46, code: 'VIETBANK',  bin: '970433', name: 'Ngân hàng TMCP Việt Nam Thương Tín',                            shortName: 'VietBank',          logo: 'https://cdn.vietqr.io/img/VIETBANK.png',     transferSupported: 1, lookupSupported: 1 },
  { id: 5,  code: 'BVB',       bin: '970438', name: 'Ngân hàng TMCP Bảo Việt',                                       shortName: 'BaoVietBank',       logo: 'https://cdn.vietqr.io/img/BVB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 33, code: 'SEAB',      bin: '970440', name: 'Ngân hàng TMCP Đông Nam Á',                                     shortName: 'SeABank',           logo: 'https://cdn.vietqr.io/img/SEAB.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 52, code: 'COOPBANK',  bin: '970446', name: 'Ngân hàng Hợp tác xã Việt Nam',                                shortName: 'COOPBANK',          logo: 'https://cdn.vietqr.io/img/COOPBANK.png',     transferSupported: 1, lookupSupported: 1 },
  { id: 20, code: 'LPB',       bin: '970449', name: 'Ngân hàng TMCP Lộc Phát Việt Nam',                             shortName: 'LPBank',            logo: 'https://cdn.vietqr.io/img/LPB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 19, code: 'KLB',       bin: '970452', name: 'Ngân hàng TMCP Kiên Long',                                      shortName: 'KienLongBank',      logo: 'https://cdn.vietqr.io/img/KLB.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 55, code: 'KBank',     bin: '668888', name: 'Ngân hàng Đại chúng TNHH Kasikornbank',                         shortName: 'KBank',             logo: 'https://cdn.vietqr.io/img/KBANK.png',        transferSupported: 1, lookupSupported: 1 },
  { id: 62, code: 'MAFC',      bin: '977777', name: 'Công ty Tài chính TNHH MTV Mirae Asset (Việt Nam)',             shortName: 'MAFC',              logo: 'https://cdn.vietqr.io/img/MAFC.png',         transferSupported: 0, lookupSupported: 0 },
  { id: 13, code: 'HLBVN',     bin: '970442', name: 'Ngân hàng TNHH MTV Hong Leong Việt Nam',                        shortName: 'HongLeong',         logo: 'https://cdn.vietqr.io/img/HLBVN.png',        transferSupported: 0, lookupSupported: 1 },
  { id: 7,  code: 'CIMB',      bin: '422589', name: 'Ngân hàng TNHH MTV CIMB Việt Nam',                             shortName: 'CIMB',              logo: 'https://cdn.vietqr.io/img/CIMB.png',         transferSupported: 1, lookupSupported: 1 },
  { id: 49, code: 'WVN',       bin: '970457', name: 'Ngân hàng TNHH MTV Woori Việt Nam',                             shortName: 'Woori',             logo: 'https://cdn.vietqr.io/img/WVN.png',          transferSupported: 1, lookupSupported: 1 },
  { id: 14, code: 'HSBC',      bin: '458761', name: 'Ngân hàng TNHH MTV HSBC (Việt Nam)',                            shortName: 'HSBC',              logo: 'https://cdn.vietqr.io/img/HSBC.png',         transferSupported: 0, lookupSupported: 1 },
  { id: 32, code: 'SCVN',      bin: '970410', name: 'Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam',          shortName: 'StandardChartered', logo: 'https://cdn.vietqr.io/img/SCVN.png',         transferSupported: 0, lookupSupported: 1 },
  { id: 28, code: 'PBVN',      bin: '970439', name: 'Ngân hàng TNHH MTV Public Việt Nam',                           shortName: 'PublicBank',        logo: 'https://cdn.vietqr.io/img/PBVN.png',         transferSupported: 0, lookupSupported: 1 },
  { id: 6,  code: 'CBB',       bin: '970444', name: 'Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam',              shortName: 'CBBank',            logo: 'https://cdn.vietqr.io/img/CBB.png',          transferSupported: 0, lookupSupported: 1 },
  { id: 9,  code: 'Vikki',     bin: '970406', name: 'Ngân hàng TNHH MTV Số Vikki',                                  shortName: 'Vikki',             logo: 'https://cdn.vietqr.io/img/Vikki.png',        transferSupported: 0, lookupSupported: 1 },
  { id: 48, code: 'VRB',       bin: '970421', name: 'Ngân hàng Liên doanh Việt - Nga',                              shortName: 'VRB',               logo: 'https://cdn.vietqr.io/img/VRB.png',          transferSupported: 0, lookupSupported: 1 },
  { id: 11, code: 'GPB',       bin: '970408', name: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu',              shortName: 'GPBank',            logo: 'https://cdn.vietqr.io/img/GPB.png',          transferSupported: 0, lookupSupported: 1 },
];

/** Lookup map: code → bank object. O(1) access for validation. */
export const VN_BANK_MAP: Record<string, VNBank> = Object.fromEntries(
  VN_BANKS.map(b => [b.code, b]),
);

/** Only banks that support QR transfer — use for deposit QR forms. */
export const VN_BANKS_TRANSFER: VNBank[] = VN_BANKS.filter(b => b.transferSupported === 1);
