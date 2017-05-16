#!/bin/bash

docker run -it -p 8080:80 -v `pwd`/build:/usr/share/nginx/html nginx:alpine
