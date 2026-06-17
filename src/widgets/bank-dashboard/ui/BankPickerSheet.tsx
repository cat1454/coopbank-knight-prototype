
import { Building2, Search, X } from "lucide-react";
import type { TransferBank } from "../../../entities/bank/model/transferBanks";

interface BankPickerSheetProps {
  bankPickerOpen: boolean;
  bankSearch: string;
  setBankSearch: (value: string) => void;
  setBankPickerOpen: (value: boolean) => void;
  filteredTransferBanks: TransferBank[];
  transferBank: string;
  selectTransferBank: (bank: TransferBank) => void;
}

export function BankPickerSheet({
  bankPickerOpen,
  bankSearch,
  setBankSearch,
  setBankPickerOpen,
  filteredTransferBanks,
  transferBank,
  selectTransferBank,
}: BankPickerSheetProps) {
    if (!bankPickerOpen) return null;

    return (
      <div
        className="bank-sheet-backdrop"
        role="presentation"
        onMouseDown={() => {
          setBankSearch("");
          setBankPickerOpen(false);
        }}
      >
        <section
          className="bank-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bank-sheet-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="bank-sheet__close"
            aria-label="Đóng chọn ngân hàng"
            onClick={() => {
              setBankSearch("");
              setBankPickerOpen(false);
            }}
          >
            <X size={24} aria-hidden="true" />
          </button>

          <h2 id="bank-sheet-title">Bạn muốn chuyển khoản tới ngân hàng nào?</h2>

          <div className="bank-sheet__search">
            <span className="bank-sheet__search-icon" aria-hidden="true">
              <Building2 size={18} />
            </span>
            <input
              type="text"
              role="combobox"
              aria-label="Tìm ngân hàng"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls="bank-sheet-options"
              placeholder="ngân hàng nào?"
              value={bankSearch}
              autoFocus
              onChange={(event) => setBankSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setBankSearch("");
                  setBankPickerOpen(false);
                }
              }}
            />
            <Search size={19} aria-hidden="true" />
          </div>

          <div className="bank-sheet__list" role="listbox" id="bank-sheet-options" aria-label="Danh sách ngân hàng">
            {filteredTransferBanks.map((bank) => (
              <button
                type="button"
                role="option"
                aria-label={`${bank.listTitle} ${bank.legalName}`}
                aria-selected={bank.displayName === transferBank}
                className="bank-sheet__option"
                key={bank.code}
                onClick={() => selectTransferBank(bank)}
              >
                <span className="bank-sheet__logo">
                  <img src={bank.logoUrl} alt={`Logo ${bank.displayName}`} referrerPolicy="no-referrer" />
                </span>
                <span className="bank-sheet__copy">
                  <strong>{bank.listTitle}</strong>
                  <small>{bank.legalName}</small>
                </span>
              </button>
            ))}

            {filteredTransferBanks.length === 0 ? (
              <p className="bank-sheet__empty">Không tìm thấy ngân hàng có logo xác thực.</p>
            ) : null}
          </div>
        </section>
      </div>
    );
}
