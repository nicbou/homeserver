from django.contrib import admin
from .models import Account, Balance, Transaction


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'balance',)


@admin.register(Balance)
class BalanceAdmin(admin.ModelAdmin):
    list_display = ('account', 'balance', 'date_added',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('account', 'title', 'description', 'date', 'amount')
