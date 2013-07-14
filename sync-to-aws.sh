rsync --verbose  --progress --stats --compress --rsh=/usr/bin/ssh --recursive --times --perms --links --delete --exclude "*bak" --exclude "*~" ~/www/personalinfo/* ubuntu@aws:~/www/personalinfo/
