from .models import Account, Transaction
from django.http import JsonResponse
from django.views import View
from django.utils import timezone
from datetime import timedelta


class JSONAccountListView(View):
    def get(self, request, *args, **kwargs):
        if not request.user.has_perm('authentication.finances'):
            return JsonResponse({
                'result': 'failure',
                'message': 'You do not have the permission to access this feature'
            }, status=403)

        balance_days_to_fetch = 30
        try:
            balance_days_to_fetch = int(request.GET.get('days', balance_days_to_fetch))
        except ValueError:
            pass

        balance_date_from = timezone.now() - timedelta(days=balance_days_to_fetch)

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
                    } for balance in account.balance_set.filter(date_added__gte=balance_date_from)
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
