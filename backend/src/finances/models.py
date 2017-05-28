from django.db import models


class Account(models.Model):
    display_name = models.CharField(max_length=40)
    name = models.CharField(max_length=40)
    is_credit = models.BooleanField(default=False)

    def __unicode__(self):
        return self.display_name

    class Meta:
        ordering = ["display_name"]


class Balance(models.Model):
    account = models.ForeignKey(Account)
    balance = models.DecimalField(max_digits=8, decimal_places=2, null=True)
    date_added = models.DateTimeField(default=timezone.now)

    def __unicode__(self):
        return "{account}, {balance:.0f}€ on {date}".format(
            account=self.account.display_name,
            balance=self.balance,
            date=self.date_added,
        )

    class Meta:
        ordering = ["-date_added", "account"]
        verbose_name = 'Account balance'
        verbose_name_plural = 'Account balances'


class Transaction(models.Model):
    transaction_id = models.CharField(max_length=200, unique=True)
    account = models.ForeignKey(Account)
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    amount = models.DecimalField(max_digits=8, decimal_places=2, null=True)

    # When the currencies fluctuate, get_or_create sees the same transaction as different because the amounts differ
    original_currency_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True)

    def __unicode__(self):
        return self.title

    class Meta:
        ordering = ["-date"]
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
