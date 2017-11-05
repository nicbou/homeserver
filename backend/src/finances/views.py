from .models import Account, Transaction
from django.http import JsonResponse
from django.views import View


class JSONAccountListView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.finances'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

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


class JSONTransactionListView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.finances'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

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
