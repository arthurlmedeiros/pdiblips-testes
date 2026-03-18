.PHONY: lint build test

lint:
	cd ../.. && npm run lint -- --filter=testes

build:
	cd ../.. && npm run build

test:
	cd ../.. && npm test -- --filter=testes
