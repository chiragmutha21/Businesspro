import sys
import re

with open('src/components/Transactions.tsx', 'r', encoding='utf-8') as f:
    tx_text = f.read()

# Replace creation logic block sets
tx_text = tx_text.replace("setEstimates([record, ...estimates]);", "addTransaction(record as any);")
tx_text = tx_text.replace("setProformaInvoices([record, ...proformaInvoices]);", "addTransaction(record as any);")
tx_text = tx_text.replace("setPaymentsIn([record, ...paymentsIn]);", "addTransaction(record as any);")
tx_text = tx_text.replace("setSaleOrders([record, ...saleOrders]);", "addTransaction(record as any);")
tx_text = tx_text.replace("setDeliveryChallans([record, ...deliveryChallans]);", "addTransaction(record as any);")
tx_text = tx_text.replace("setSaleReturns([record, ...saleReturns]);", "addTransaction(record as any);")

with open('src/components/Transactions.tsx', 'w', encoding='utf-8') as f:
    f.write(tx_text)
