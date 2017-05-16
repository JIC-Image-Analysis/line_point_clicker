all: build/app.js build/index.html

build/app.js: build/pre_app.js
	mv build/pre_app.js build/app.js

build/pre_app.js: src/app.ts
	tsc	

build/index.html: src/index.html
	cp src/index.html build/

clean:
	rm build/*
