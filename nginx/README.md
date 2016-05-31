# NginX Configuration

To configure NginX you need to place files from this folder into the proper places. You can do it with the following commands:

* Place NginX site config instead of the `default` config: `cp ./nginx.conf /etc/nginx/sites-available/default`
* Place certificates in the NginX folder: `cp ./genomix.key ./genomix.crt /etc/nginx/` **Be sure you have certificates corresponding current server host name.**
* Restart NginX `sudo nginx -s reload`
