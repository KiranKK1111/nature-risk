FROM artifactory.global.standardchartered.com/gv-images-products/bi/ubi9/ubi:9.7-1770238273-10332950
USER root

RUN yum -y install nginx
RUN yum -y install libarchive
RUN yum -y install glib2
RUN yum -y install libxml2
RUN yum -y install pam
RUN mkdir -p /usr/share/nginx/build/html
RUN mkdir -p /usr/share/nginx/build/conf.d
RUN mkdir -p /usr/share/nginx/run/
RUN chmod -R 775 /usr/share/nginx/run

RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp 
RUN mkdir -p /var/cache/nginx/proxy_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/cache/nginx/fastcgi_temp
# RUN chown -R nginx:nginx /var/cache/nginx/proxy_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/cache/nginx/fastcgi_temp
RUN chmod -R 775 /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp 
RUN chmod -R 775 /var/cache/nginx/proxy_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/cache/nginx/fastcgi_temp
# RUN chown -R nginx:nginx /var/cache/nginx/proxy_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/cache/nginx/fastcgi_temp

# Create PID files
RUN touch /var/run/nginx.pid
RUN chmod 775 /var/run/nginx.pid

# RUN chown -R nginx:nginx /etc/nginx
#Copy Config and Build files
COPY ./build /usr/share/nginx/build/html
COPY ./entrypoint.sh ./default.conf /usr/share/nginx/build/conf.d/
COPY ./nginx.conf /etc/nginx/nginx.conf
RUN chmod -R 775 /usr/share/nginx/build/conf.d/entrypoint.sh
# RUN chmod -R 775 /etc/nginx/nginx.conf
# RUN chown -R nginx:nginx /usr/share/nginx/build/conf.d/entrypoint.sh

RUN chmod -R 775 /var/log/nginx
RUN ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log
# RUN chown -R nginx:nginx /var/log/nginx

USER nginx

ENTRYPOINT ["/usr/share/nginx/build/conf.d/entrypoint.sh"]

# Getting user to run
# USER nginx
