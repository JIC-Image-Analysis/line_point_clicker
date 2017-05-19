all: build/app.js build/index.html

build/app.js: build/pre_app.js check-env
	sed s/localhost/$(DSERVE_HOSTNAME)/ < build/pre_app.js > build/app.js
	rm build/pre_*

build/pre_app.js: src/app.ts
	tsc	

build/index.html: src/index.html
	cp src/index.html build/

check-env:
ifndef DSERVE_HOSTNAME
	$(error DSERVE_HOSTNAME is undefined)
endif

clean:
	rm build/*
