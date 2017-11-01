from .models import Account, Transaction
from utils.views import LoginRequiredMixin
from django.http import JsonResponse
from django.views import View


class JSONAccountListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        json_accounts = []
        for account in Account.objects.all():
            json_accounts.append({
                'id': account.name,
                'displayName': account.display_name,
                'isCredit': account.is_credit,
                'isActive': account.active,
                'balances': [
                    {
                        'balance': float(balance.balance),
                        'date': balance.date_added,
                    } for balance in account.balance_set.all()
                ],
            })

        return JsonResponse({'accounts': json_accounts})


class JSONTransactionListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        json_transactions = []
        for transaction in Transaction.objects.all():
            json_transactions.append({
                'accountId': transaction.account.name,
                'accountDisplayName': transaction.account.display_name,
                'title': transaction.title,
                'description': transaction.description,
                'date': transaction.date,
                'amount': float(transaction.amount),
            })

        return JsonResponse({'transactions': json_transactions})
