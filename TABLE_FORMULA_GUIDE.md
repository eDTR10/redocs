## Table Formula Feature Usage Guide

### Overview
You can now add formulas to table columns, making them calculated fields similar to Excel. This allows for automatic calculations within tables.

### How to Use Table Formulas

1. **Create a Table Field**
   - Add a new field and select "Table" as the field type
   - Configure the number of rows needed

2. **Configure Table Columns**
   - Click "Add Column" to add columns to your table
   - For each column, you can set:
     - **Column Label**: Display name for the column
     - **Column Type**: Choose from Text, Number, Date, or Select
     - **Width**: Set column width (e.g., 100px, 20%, auto)

3. **Add Formulas to Number Columns**
   - When you select "Number" as the column type, a formula field appears
   - Use the dropdown to easily insert field references
   - Write Excel-like formulas using field IDs

### Formula Examples

#### Basic Arithmetic
- `price + tax` - Add two fields
- `quantity * price` - Multiply fields
- `(subtotal + tax) * 0.1` - Complex calculation with parentheses

#### Referencing Other Fields
- `field1 + field2` - Reference regular form fields
- `table1.column1 + table1.column2` - Reference other table columns
- `group1.subfield1 * 2` - Reference group sub-fields  

#### Table-Specific References
- In a table, you can reference:
  - Other columns in the same table: `price * quantity`
  - Columns from other tables: `othertable.price * quantity`
  - Regular form fields: `base_amount + table1.tax`

### Supported Operations
- **Arithmetic**: `+`, `-`, `*`, `/`
- **Parentheses**: `(price + tax) * quantity`
- **Functions**: `sqrt()`, `abs()`, `round()`, `sin()`, `cos()`, etc.
- **Constants**: You can use numbers directly: `field1 * 0.1`

### Visual Indicators
- **Calculated columns** have a blue background and are read-only
- **Formula display** shows below calculated cells in preview mode
- **Error handling** displays "Error" if formula is invalid

### Field Reference Format
- **Regular fields**: `fieldname`
- **Table cells**: `tablename.columnname`
- **Group fields**: `groupname.subfieldname`

### Example Use Cases

1. **Invoice Table**
   - Columns: Item, Quantity (number), Price (number), Total (number with formula)
   - Total formula: `quantity * price`

2. **Expense Report**
   - Columns: Description, Amount (number), Tax Rate (number), Tax (number), Final (number)  
   - Tax formula: `amount * tax_rate`
   - Final formula: `amount + tax`

3. **Order Form**
   - Columns: Product, Qty (number), Unit Price (number), Discount % (number), Line Total (number)
   - Line Total formula: `qty * unit_price * (1 - discount / 100)`

### Tips
- Use the field reference dropdown to avoid typing errors
- Test formulas in preview mode to see real-time calculations
- Formula fields are automatically read-only for users
- Complex formulas support parentheses and mathematical functions
