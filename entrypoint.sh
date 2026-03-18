#!/bin/bash

#ls /home/tdebuild/goldenversions/nginx-1.20.1/cra
ls -l /usr/share/nginx/run/


mkdir -p /usr/share/nginx/run/
mkdir -p /usr/share/nginx/run/html
mkdir -p /usr/share/nginx/run/config

cp -r /usr/share/nginx/build/html/* /usr/share/nginx/run/html
cp /usr/share/nginx/build/conf.d/default.conf /usr/share/nginx/run/config/default.conf

default_X_FRAME_OPTIONS="SAMEORIGIN"
default_X_CONTENT_TYPE_OPTIONS="nosniff"
default_X_XSS_PROTECTION="\"1; mode=block\""
default_CONTENT_SECURITY_POLICY="\"default-src 'self'; frame-src *.standardchartered.com; frame-ancestors *.standardchartered.com; script-src 'self' 'unsafe-inline'; img-src 'self' data: https://thebridge.zone1.scb.net; style-src 'self' 'unsafe-inline'; font-src 'self' data:;connect-src * data:\" always"
default_STRICT_TRANSPORT_SECURITY="\"max-age=31536000; includeSubDomains\""

#download external config if provided
if [ ! -z $NGINX_CONFIG_URL ]
then
    echo "External config file provided. Will attempt to download"
    curl -o /usr/share/nginx/run/config/default.conf $NGINX_CONFIG_URL
fi

updateNGINXConfig()
{
    config_name=$1
    config_value=$2
    encrypt=$3
    if [ ! -z "$config_name" ] && [ ! -z "$config_value" ]
    then
        if [ ! -z "$encrypt" ]
        then
            config_value=`printf $config_value | base64 | base64 | base64`;
        fi
        sed -i "s#{$config_name}#${config_value}#g" /usr/share/nginx/run/html/index.html
    fi
}

updateNGINXConfig()
{
    config_name=$1
    config_value=$2
    default=$3
    if [ ! -z "$config_name" ]
    then
       sed -i "s#{$config_name}#${config_value:-$default}#g" /usr/share/nginx/run/config/default.conf
    fi
}

#NGINX Config
updateNGINXConfig "AUTH_HOST" $AUTH_HOST
updateNGINXConfig "API_HOST" $API_HOST
updateNGINXConfig "API_ONECERT_HOST" $API_ONECERT_HOST
updateNGINXConfig "SERVER_NAME" $SERVER_NAME 'localhost'
updateNGINXConfig "CLIENT_MAX_BODY_SIZE" $CLIENT_MAX_BODY_SIZE 0
updateNGINXConfig "X_FRAME_OPTIONS" $X_FRAME_OPTIONS $default_X_FRAME_OPTIONS
updateNGINXConfig "X_CONTENT_TYPE_OPTIONS" $X_CONTENT_TYPE_OPTIONS $default_X_CONTENT_TYPE_OPTIONS

#Not using updateNGINXConfig as the default value contains quotes
sed -i "s#{X_XSS_PROTECTION}#${X_XSS_PROTECTION:-$default_X_XSS_PROTECTION}#g" /usr/share/nginx/run/config/default.conf
sed -i "s#{CONTENT_SECURITY_POLICY}#${CONTENT_SECURITY_POLICY:-$default_CONTENT_SECURITY_POLICY}#g" /usr/share/nginx/run/config/default.conf
sed -i "s#{STRICT_TRANSPORT_SECURITY}#${STRICT_TRANSPORT_SECURITY:-$default_STRICT_TRANSPORT_SECURITY}#g" /usr/share/nginx/run/config/default.conf
grep -ilR 'localhost' /usr/share/nginx/run/html | xargs sed -i "s#http://localhost:8091#${NATURERISK_REMOTE_HOST}#g"

echo "<!DOCTYPE html><html lang="en"><body>RUNNING</body></html>" > /usr/share/nginx/run/html/healthcheck.html

more /usr/share/nginx/run/config/default.conf
more /usr/share/nginx/run/html/index.html

# Run nginx
nginx -g "daemon off;"