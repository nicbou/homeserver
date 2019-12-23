#!/usr/local/bin/python
# -*- coding: utf-8 -*-
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand
from finances.models import Balance, Account, Transaction
from datetime import datetime
import requests
import logging


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetches and records the bank accounts\' balance from an N26 account'
    args = ''

    user_agent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'

    def get_access_token(self):
        request = requests.post(
            'https://api.tech26.de/oauth/token',
            headers={
                'Authorization': 'Basic bXktdHJ1c3RlZC13ZHBDbGllbnQ6c2VjcmV0',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': self.user_agent
            },
            data={
                'username': settings.N26_USERNAME,
                'password': settings.N26_PASSWORD,
                'grant_type': 'password',
            }
        )
        token = request.json().get('access_token')
        if not token:
            raise Exception('No token returned. Perhaps invalid credentials were supplied?', request.json())
        return token

    def get_headers(self, access_token):
        return {
            'Authorization': 'bearer ' + access_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': self.user_agent,
        }

    def get_balance(self, access_token, account):
        balance = Decimal(
            requests.get(
                'https://api.tech26.de/api/me?full=true',
                headers=self.get_headers(access_token)
            )
            .json()
            .get('account')
            .get('availableBalance')
        )
        Balance(account=account, balance=Decimal(balance)).save()

    def get_transactions(self, access_token, account):
        transactions_request = requests.get(
            'https://api.tech26.de/api/smrt/transactions?sort=visibleTS&dir=DESC&limit=300',
            headers=self.get_headers(access_token)
        )
        transactions = transactions_request.json()

        # Unfortunately, N26 randomly "moves" transactions, changing
        # their ID, date and sometimes merchant name (e.g. to uppercase
        # Because of that, we can't really save them without
        # getting random duplicates, so we overwrite them.
        Transaction.objects.filter(account=account).delete()

        for transaction in transactions:
            amount = Decimal(transaction.get('amount', 0))
            original_currency_amount = Decimal(transaction.get('originalAmount', 0))
            transaction_id = transaction.get('id')
            title = (
                transaction.get('merchantName') or
                transaction.get('partnerName') or
                'Unknown merchant'
            )
            if transaction.get('category') == "micro-v2-income":
                title = 'Transfer from ' + transaction.get('partnerName')
            elif transaction.get('category') == "micro-v2-atm":
                title = 'Withdrawal from ' + transaction.get('merchantName')
            date = datetime.fromtimestamp(transaction.get('createdTS') / 1000)

            description = ''
            if transaction.get('originalCurrency', 'EUR') != 'EUR':
                description = 'Converted from {}'.format(transaction.get('originalCurrency'))

            transaction, is_new = Transaction.objects.update_or_create(
                account=account,
                transaction_id=transaction_id,
                defaults={
                    'original_currency_amount': original_currency_amount,
                    'date': date,
                    'title': title,
                    'amount': amount,
                    'description': description,
                }
            )

    def handle(self, *args, **options):
        access_token = self.get_access_token()

        account = Account.objects.get_or_create(name='n26', is_credit=False)[0]

        try:
            self.get_balance(access_token, account)
            self.get_transactions(access_token, account)
            logger.info("N26 balance and transactions retrieved")
        except:
            logger.exception("Could not retrieve N26 balance and transactions")
