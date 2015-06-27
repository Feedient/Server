MOCHA?=./node_modules/.bin/mocha
MOCHA_REPORTER?=spec
MOCHA_FLAGS=--reporter $(MOCHA_REPORTER) --colors --bail
ISTANBUL?=./node_modules/.bin/istanbul

# Files to test
TESTS=$(shell find test/unit/ -name "*.js")

test:
	@NODE_ENV="test" \
	env NODE_PORT=8004 \
	$(MOCHA) $(shell find ./test -name "*-test.js") $(MOCHA_FLAGS)

one:
	@NODE_ENV="test" \
	env NODE_PORT=8004 \
	$(MOCHA) $(NAME) $(MOCHA_FLAGS)

unit:
	@NODE_ENV="test" \
	env NODE_PORT=8004 \
	$(MOCHA) $(shell find ./test/unit -name "*.js") $(MOCHA_FLAGS)

integration:
	@NODE_ENV="test" \
	env NODE_PORT=8004 \
	$(MOCHA) $(shell find ./test/integration -name "*-test.js") $(MOCHA_FLAGS)

acceptance:
	@NODE_ENV="test" \
	env NODE_PORT=8004 \
	$(MOCHA) $(shell find ./test/acceptance -name "*-test.js") $(MOCHA_FLAGS)

cov:
	$(ISTANBUL) cover _mocha -- $(TESTS) -R spec

.PHONY: test
