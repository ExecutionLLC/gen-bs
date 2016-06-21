# AS - WS Interaction

## Definitions

**AS Session** - id of an operation. Multiple AS sessions can be related to one user session. AS knows nothing about the users and their sessions, it knows only about their operations.

## Redis Data Format

Answer with data from AS contains the following things:

* Redis connection parameters
* Database number. Databases are used to distinguish data from different search requests.
* Name of the key where data indices are stored. The corresponding list contains row numbers used as keys for items from which the actual rows should be retrieved.

The data in Redis is organized as follows:

* Each row is available by the key `row:<row-number-here>`.
* Row is a hash with column names used as keys and column values used as values.
* Column names from sources are prepended by the source name. Column names from VCF file are left as they are.
* Search key field, named `search_key`, is also put to each row, which is used later to add comments to the rows.
