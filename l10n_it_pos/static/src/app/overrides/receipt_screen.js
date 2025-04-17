import { patch } from "@web/core/utils/patch";
import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { onMounted } from "@odoo/owl";

patch(ReceiptScreen.prototype, {
    setup() {
        super.setup(...arguments);
        onMounted(async () => {
            if (this.pos.config.company_id.country_id.code === "IT") {
                await this.printReceipt();
                if (this.pos.config.it_fiscal_cash_drawer) {
                    await this.pos.fiscalPrinter.openCashDrawer();
                }
            }
        });
    },

    async printReceipt() {
        if (this.pos.config.company_id.country_id.code !== "IT") {
            return super.printReceipt(...arguments);
        }

        const order = this.pos.get_order();

        const result = order.to_invoice
            ? await this.pos.fiscalPrinter.printFiscalInvoice()
            : await this.pos.fiscalPrinter.printFiscalReceipt();

        if (result.success) {
            this.pos.data.write("pos.order", [order.id], {
                it_fiscal_receipt_number: result.addInfo.fiscalReceiptNumber,
                it_fiscal_receipt_date: result.addInfo.fiscalReceiptDate,
                it_z_rep_number: result.addInfo.zRepNumber,
            });
            return true;
        }
    },
});
