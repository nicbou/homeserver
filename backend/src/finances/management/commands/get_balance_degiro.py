#!/usr/local/bin/python
# -*- coding: utf-8 -*-
from django.conf import settings
from django.core.management.base import BaseCommand
from finances.models import Balance, Account
import requests
import logging
import json


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetches and records the bank accounts\' balance from a Degiro account'
    args = ''

    def get_session_id(self):
        payload = {
            "username": settings.DEGIRO_USERNAME,
            "password": settings.DEGIRO_PASSWORD,
        }
        response = requests.post("https://trader.degiro.nl/login/secure/login", json.dumps(payload))
        return response.json()['sessionId']

    def get_account_id(self, session_id):
        response = requests.get(
            "https://trader.degiro.nl/pa/secure/client?sessionId={session_id}".format(session_id=session_id)
        )
        return response.json()['data']['intAccount']

    def get_portfolio(self, session_id, account_id):
        response = requests.get(
            "https://trader.degiro.nl/trading/secure/v5/update/{acct_id};jsessionid={session_id}".format(
                acct_id=account_id,
                session_id=session_id
            ),
            params={'portfolio': 0, 'totalPortfolio': 0}
        )
        return response.json()

    def get_balance(self, portfolio):
        balances = portfolio['totalPortfolio']['value']
        return [balance['value'] for balance in balances if balance['name'] == 'reportNetliq'][0]

    def handle(self, *args, **options):
        account = Account.objects.get_or_create(name='degiro', is_credit=False)[0]
        try:
            session_id = self.get_session_id()
            account_id = self.get_account_id(session_id)
            portfolio = self.get_portfolio(session_id, account_id)
            balance = self.get_balance(portfolio)

            account = Account.objects.get_or_create(name='degiro', is_credit=False)[0]
            account.save()

            balance = Balance(account=account, balance=balance)
            balance.save()

            logger.info("Degiro balance and transactions retrieved")
        except:
            logger.exception("Could not retrieve Degiro balance and transactions")
