#!/usr/local/bin/python
# -*- coding: utf-8 -*-
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand
from selenium import webdriver
from finances.models import Balance, Account, Transaction
from datetime import datetime
import re


class Command(BaseCommand):
    help = 'Fetches and records the bank accounts\' balance from Commerzbank'
    args = ''

    account_label_to_name = {
        '0-Euro-Konto': 'Commerzbank debit',
        'MasterCard Classic': 'Commerzbank credit',
        'DirektDepot': 'Commerzbank securities',
        'TagesgeldKonto': 'Commerzbank savings'
    }

    def login(self):
        def submit_credentials():
            account_number_field = self.driver.find_element_by_id("teilnehmer")
            account_number_field.send_keys(settings.COMMERZBANK_ACCOUNT_NUMBER)

            pin_field = self.driver.find_element_by_id("pin")
            pin_field.send_keys(settings.COMMERZBANK_PASSWORD)

            self.driver.find_element_by_id("headerLoginSubmit").click()

        self.driver.set_window_size(1200, 800)  # This site is responsive
        self.driver.implicitly_wait(5)
        self.driver.get(
            "https://kunden.commerzbank.de/portal/en/englisch/english.html")

        submit_credentials()
        try:
            # Handles "someone else is logged in with that account"
            submit_credentials()
        except:
            pass

        self.driver.implicitly_wait(5)

    def logout(self):
        self.driver.get("https://kunden.commerzbank.de/lp/logout")

    def get_account_balances(self):
        balance_rows = self.driver.find_elements_by_css_selector(
            "#financeOverviewPanel .financetable .expander-details")

        for row in balance_rows:
            account_label = row.find_element_by_css_selector('td:first-child a').text.strip()
            balance_string = row.find_element_by_css_selector('td:last-child span.show-tooltip').get_attribute('title')
            balance_string = re.sub(r'\s+', '', balance_string)
            balance_string = balance_string.strip().replace(',', '').replace('EUR', '').replace('+', '')

            account_name = self.account_label_to_name.get(account_label)

            if account_name:
                is_credit = account_name == 'Commerzbank credit'

                account = Account.objects.get_or_create(
                    name=account_name,
                    is_credit=is_credit
                )[0]
                account.save()

                balance = Balance(
                    account=account,
                    balance=Decimal(balance_string)
                )
                balance.save()

    def get_transactions(self, account_label):
        balance_rows = self.driver.find_elements_by_css_selector(
            "#financeOverviewPanel .financetable .expander-details")

        # Find this account in the transaction overview page
        account = None
        for row in balance_rows:
            row_account_label_link = row.find_element_by_css_selector('td:first-child a')
            row_account_label = row_account_label_link.text.strip()
            if row_account_label == account_label:
                account_name = self.account_label_to_name.get(account_label)
                account = Account.objects.get_or_create(name=account_name)[0]

                row_account_label_link.click()
                break

        # Removes superfluous whitespace from given string
        def cleanup_text(text):
            return re.sub(r'(\n)+', '\n', text.replace('\t', '')).strip()

        # Get all transactions for this account
        transactions = []
        transaction_elements = self.driver.find_elements_by_css_selector(
            ".expander_table.transactions.dhb-credit-body>tbody, .expander_table.transactions.dhb-current-body>tbody")

        for transaction_element in transaction_elements:
            detail_paragraphs = transaction_element.find_elements_by_css_selector(
                "tr.expander-details>td>table>tbody>tr>.expander_details_column_1>div>p")

            amount = Decimal(
                transaction_element
                .find_elements_by_css_selector(".expander-handle>.expander_handle_column_6")[-1]
                .text.replace(',', '').replace('EUR', '').replace(' ', '').replace('+', '')
            )

            transaction_title = ''
            transaction_description = ''
            parsed_transaction_date = ''
            if len(detail_paragraphs) > 1:
                # Debit row parsing
                transaction_title = cleanup_text(
                    self.driver.execute_script("return arguments[0].textContent", detail_paragraphs[0]))

                transaction_description = cleanup_text(
                    self.driver.execute_script("return arguments[0].textContent", detail_paragraphs[1]))

                unparsed_transaction_date = cleanup_text(
                    self.driver.execute_script("return arguments[0].textContent", detail_paragraphs[2])
                ).replace('\n', '')
                parsed_transaction_date = datetime.strptime(unparsed_transaction_date, 'Value date%d.%m.%Y')
            else:
                # Credit row parsing
                transaction_title = (
                    transaction_element
                    .find_element_by_css_selector(".expander-handle>.expander_handle_column_1")
                    .text
                )
                unparsed_transaction_date = transaction_element.find_element_by_css_selector(
                    ".expander_details_column_1 p:last-child"
                ).get_attribute('innerHTML').strip()
                parsed_transaction_date = datetime.strptime(unparsed_transaction_date, '%d.%m.%Y')

            transaction, is_new = Transaction.objects.get_or_create(
                account=account,
                original_currency_amount=amount,
                title=transaction_title,
                description=transaction_description,
                date=parsed_transaction_date,
                defaults={
                    'amount': amount
                }
            )
            if is_new:
                transactions.append(transaction)

        self.driver.get("https://kunden.commerzbank.de/banking/landingpage?0")

        return transactions

    def handle(self, *args, **options):
        try:
            self.driver = webdriver.PhantomJS(service_args=['--ignore-ssl-errors=true', '--ssl-protocol=any'])
            self.login()
            self.get_account_balances()

            self.get_transactions('0-Euro-Konto')
            self.get_transactions('TagesgeldKonto')
            self.get_transactions('MasterCard Classic')

            self.logout()
            self.driver.quit()
        finally:
            self.driver.quit()
