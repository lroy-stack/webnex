# Database Structure Directory

This directory is used by the export scripts to store the database structure files.

When you run the `export_db_structure.sh` script, the following files will be created in this directory:

- `schema.sql`: The raw schema dump from Supabase
- `init.sql`: Initialization SQL with custom types and functions
- `webnex_db_structure.sql`: Combined file ready for import

## Usage

To export the database structure:

```bash
chmod +x export_db_structure.sh
./export_db_structure.sh
```

To import the database structure into a new Supabase project:

1. Create a new Supabase project
2. Go to the SQL Editor in the Supabase Dashboard
3. Copy and paste the contents of `webnex_db_structure.sql`
4. Execute the SQL
5. Create a user with the email specified in the admin setup section (default: admin@example.com)
6. Run the final admin setup section again to assign the admin role

For more information, see the `DB_README.md` file in the root directory.
