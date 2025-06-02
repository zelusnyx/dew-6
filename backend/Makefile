ifdef PORT
PORT := $(PORT)
else
PORT := 4000
endif

build: 
	docker build -t dew:$(shell git log -1 --format=%h) .

create_db:
	mkdir -p db/
	cd db; touch database.db

run:
	docker run -m 950MB -p $(PORT):80 --env-file ./secrets.env -v $(shell pwd)/db:/app/db --name dew-api-$(shell git log -1 --format=%h) -d dew:$(shell git log -1 --format=%h)

deploy: build create_db run

image_file: build
	docker save dew:$(shell git log -1 --format=%h) | gzip > dew.tar.gz
