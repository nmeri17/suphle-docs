## Database

When using Eloquent, note that it requires having a running Laravel Container instance. This is already booted and provided by the appropriate adapters. However, as has been mentioned on the Bridge chapter (link), anything that has to do with their container requires a `config/app.php` file, relative to where the Bridge is located