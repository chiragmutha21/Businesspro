def update_render(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # We know the JSX block starts with 'return ('
    # and we just need to replace the lists before .map and .length
    # In Transactions.tsx, the lists are:
    lists = ['estimates', 'proformaInvoices', 'paymentsIn', 'saleOrders', 'deliveryChallans', 'saleReturns']
    for l in lists:
        content = content.replace(f"{{{{{l}.length", f"{{{{{l}.filter(x => x.businessId === activeBusiness?.id).length")
        content = content.replace(f"{{{{{l}.map", f"{{{{{l}.filter(x => x.businessId === activeBusiness?.id).map")
        
        # also some might be `{l.length` (single brace if they are in JSX expressions)
        content = content.replace(f"{{{l}.length", f"{{{l}.filter(x => x.businessId === activeBusiness?.id).length")
        content = content.replace(f"{{{l}.map", f"{{{l}.filter(x => x.businessId === activeBusiness?.id).map")

    # In CashBank.tsx
    lists_cb = ['cashLogs', 'cheques', 'loanAccounts', 'bankAccounts']
    # The previous multi replace in CashBank ALREADY successfully replaced with activeCashLogs, activeCheques, activeLoanAccounts, activeBankAccounts.
    # We should just verify it didn't miss any. 

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"{filename} updated successfully!")

update_render('src/components/Transactions.tsx')
