=== sales.py ===
import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    try:
        with open(path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Skip rows that don't have the 'amount' column or have invalid values
                    if 'amount' in row and row['amount']:
                        total += float(row['amount'])
                except (ValueError, TypeError):
                    # Skip malformed numeric values
                    continue
    except FileNotFoundError:
        # Handle missing file gracefully - return 0 or raise, we'll return 0 per spec
        return 0
    except csv.Error:
        # Handle CSV parsing errors
        return total
    
    return total
