from django.shortcuts import render
from models import Account
from django.core.serializers.json import DjangoJSONEncoder
from utils.views import LoginRequiredMixin, JsonResponse


class JSONAccountListView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        json_accounts = []
        for account in Account.objects.all():
            json_accounts.append({
                'id': account.name,
                'displayName': account.display_name,
                'isCredit': account.is_credit,
                'balances': [
                    {
                        'balance': float(balance.balance),
                        'date': balance.date_added,
                    } for balance in account.balance_set.all()
                ],
            })

        return JsonResponse(
            json.dumps(
                {'accounts': json_accounts},
                cls=DjangoJSONEncoder
            )
        )


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

        return JsonResponse(
            json.dumps(
                {'transactions': json_transactions},
                cls=DjangoJSONEncoder
            )
        )
