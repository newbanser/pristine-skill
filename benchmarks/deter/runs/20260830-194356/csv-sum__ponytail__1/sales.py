from csv import reader
from decimal import Decimal


def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = Decimal("0")
    with open(path, newline="") as f:
        for row in reader(f):
            # skip malformed rows where amount is missing/unparseable
            try:
                total += Decimal(row[4])
            except (IndexError, ValueError, TypeError):
                continue
    return total
