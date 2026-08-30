=== sales.py ===
import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    try:
        with open(path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            # Check if 'amount' column exists in header
            if 'amount' not in (reader.fieldnames or []):
                return 0
            
            for row in reader:
                # Skip malformed rows (missing/extra fields or None values)
                if row is None or 'amount' not in row:
                    continue
                
                # Try to parse the amount as a float, skip if unparseable
                try:
                    amount = float(row['amount'])
                    total += amount
                except (ValueError, TypeError):
                    # Skip malformed/empty amounts
                    continue
                    
    except FileNotFoundError:
        # Return 0 if file doesn't exist (or handle as needed)
        return 0
    except Exception:
        # Handle other CSV parsing errors gracefully
        return 0
    
    return total
