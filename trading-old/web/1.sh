while true
do
  cd /www/wwwroot/test.booan.com/public
  php index.php /index/index/order
  sleep 2
  php index.php /index/index/product
  sleep 2
done